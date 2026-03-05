import Booking from '../models/Booking.js'
import Escrow  from '../models/Escrow.js'
import Dispute from '../models/Dispute.js'
import User    from '../models/User.js'
import razorpay from 'razorpay'
import imagekit from '../configs/imageKit.js'
import fs from 'fs'
import { sendBookingCancellationEmail, sendBookingRefundEmail } from '../utils/Emailservice.js'

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Razorpay instance
// ─────────────────────────────────────────────────────────────────────────────
const getRazorpay = () => new razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
})

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Process Razorpay refund
// ─────────────────────────────────────────────────────────────────────────────
const processRazorpayRefund = async (paymentId, amount) => {
  const rz = getRazorpay()
  const refund = await rz.payments.refund(paymentId, {
    amount: amount * 100,  // paise
    speed: 'normal',
    notes: { reason: 'CarRento escrow refund' }
  })
  return refund
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE ESCROW — called inside verifyPayment in userController.js
//    After Razorpay signature verified, call this to hold money in escrow
// ─────────────────────────────────────────────────────────────────────────────
export const createEscrow = async (booking, paymentId) => {
  // Refund deadline = pickup date + 24 hours
  // If owner doesn't verify OTP by then → auto refund
  const refundDeadline = new Date(booking.pickupDate)
  refundDeadline.setHours(refundDeadline.getHours() + 24)

  const escrow = await Escrow.create({
    booking:        booking._id,
    user:           booking.user._id || booking.user,
    owner:          booking.owner,
    amount:         booking.price,
    paymentId:      paymentId,
    status:         'held',
    refundDeadline: refundDeadline,
  })

  // Link escrow to booking
  await Booking.findByIdAndUpdate(booking._id, { escrow: escrow._id })

  console.log(`✅ Escrow created: Rs.${booking.price} held for booking ${booking._id}`)
  return escrow
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. RELEASE ESCROW — called in verifyPickupOtp after OTP verified
//    Owner gets money — in real production this would be Razorpay payout
//    For college project: just mark as released (real payout needs RazorpayX)
// ─────────────────────────────────────────────────────────────────────────────
export const releaseEscrow = async (req, res) => {
  try {
    const { bookingId } = req.body
    const ownerId = req.user._id

    const booking = await Booking.findById(bookingId).populate('escrow')

    if (!booking) {
      return res.json({ success: false, message: 'Booking not found' })
    }

    if (booking.owner.toString() !== ownerId.toString()) {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    if (!booking.otpVerified) {
      return res.json({ success: false, message: 'OTP must be verified before releasing payment' })
    }

    const escrow = booking.escrow
    if (!escrow || escrow.status !== 'held') {
      return res.json({ success: false, message: 'Escrow not in held state' })
    }

    // Mark escrow as released
    await Escrow.findByIdAndUpdate(escrow._id, {
      status:     'released',
      releasedAt: new Date(),
      notes:      'Released after successful OTP verification at pickup'
    })

    // Mark booking as active (car is now with renter)
    await Booking.findByIdAndUpdate(bookingId, { status: 'active' })

    console.log(`✅ Escrow released: Rs.${escrow.amount} released to owner ${ownerId}`)
    return res.json({
      success: true,
      message: `Payment of Rs.${escrow.amount.toLocaleString('en-IN')} has been released. You will receive it within 2-3 business days.`
    })

  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. REFUND ESCROW — called by cron job or dispute resolution
// ─────────────────────────────────────────────────────────────────────────────
export const refundEscrow = async (escrowId, reason = 'auto_refund') => {
  try {
    const escrow = await Escrow.findById(escrowId).populate('booking')

    if (!escrow || escrow.status !== 'held') {
      console.log(`⚠️ Escrow ${escrowId} not in held state, skipping refund`)
      return null
    }

    // Process Razorpay refund
    const refund = await processRazorpayRefund(escrow.paymentId, escrow.amount)

    // Update escrow
    await Escrow.findByIdAndUpdate(escrowId, {
      status:           'refunded',
      refundedAt:       new Date(),
      razorpayRefundId: refund.id,
      notes:            reason
    })

    // Update booking
    await Booking.findByIdAndUpdate(escrow.booking._id, {
      status:        'cancelled',
      paymentStatus: 'refunded',
    })

    // Send refund email to user
    const booking = await Booking.findById(escrow.booking._id)
      .populate('car')
      .populate('user', '-password')

    await sendBookingRefundEmail(booking.user.email, {
      userName:    booking.user.name,
      carName:     `${booking.car.brand} ${booking.car.model}`,
      pickupDate:  new Date(booking.pickupDate).toDateString(),
      returnDate:  new Date(booking.returnDate).toDateString(),
      totalPrice:  booking.price,
      bookingId:   booking._id.toString(),
      refundId:    refund.id,
    })

    console.log(`✅ Escrow refunded: Rs.${escrow.amount} refunded for booking ${escrow.booking._id}`)
    return refund

  } catch (error) {
    console.log(`❌ Refund failed for escrow ${escrowId}:`, error.message)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. RAISE DISPUTE — renter raises dispute if owner doesn't show up
// ─────────────────────────────────────────────────────────────────────────────
export const raiseDispute = async (req, res) => {
  try {
    const { bookingId, reason, description } = req.body
    const userId = req.user._id

    const booking = await Booking.findById(bookingId).populate('escrow')

    if (!booking) {
      return res.json({ success: false, message: 'Booking not found' })
    }

    // Only the renter can raise dispute
    if (booking.user.toString() !== userId.toString()) {
      return res.json({ success: false, message: 'Only the renter can raise a dispute' })
    }

    // Must be confirmed + paid
    if (booking.paymentStatus !== 'paid') {
      return res.json({ success: false, message: 'No payment found for this booking' })
    }

    // Can't raise dispute if OTP already verified (car was handed over)
    if (booking.otpVerified) {
      return res.json({ success: false, message: 'Car was already handed over — cannot dispute' })
    }

    // Only one dispute per booking
    if (booking.hasDispute) {
      return res.json({ success: false, message: 'A dispute has already been raised for this booking' })
    }

    // Pickup date must have passed (can't dispute before pickup time)
    if (new Date() < new Date(booking.pickupDate)) {
      return res.json({ success: false, message: 'Cannot raise dispute before pickup date' })
    }

    const escrow = booking.escrow
    if (!escrow) {
      return res.json({ success: false, message: 'No escrow found for this booking' })
    }

    // Create dispute
    const dispute = await Dispute.create({
      booking:     bookingId,
      escrow:      escrow._id,
      raisedBy:    userId,
      reason,
      description,
      status:      'open'
    })

    // Update escrow & booking
    await Escrow.findByIdAndUpdate(escrow._id, { status: 'disputed' })
    await Booking.findByIdAndUpdate(bookingId, {
      hasDispute: true,
      dispute:    dispute._id
    })

    console.log(`⚠️ Dispute raised: ${dispute._id} for booking ${bookingId}`)
    return res.json({
      success: true,
      message: 'Dispute raised successfully. Our team will review within 24 hours and process your refund if valid.',
      disputeId: dispute._id
    })

  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET MY DISPUTES — renter views their disputes
// ─────────────────────────────────────────────────────────────────────────────
export const getMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({ raisedBy: req.user._id })
      .populate({ path: 'booking', populate: { path: 'car' } })
      .sort({ createdAt: -1 })

    return res.json({ success: true, disputes })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. RESOLVE DISPUTE — admin resolves dispute
//    resolution: 'refund' → money back to renter
//    resolution: 'release' → money released to owner
// ─────────────────────────────────────────────────────────────────────────────
 export const resolveDispute = async (req, res) => {
    if (req.user.role !== 'admin') return res.json({ success: false, message: 'Unauthorized' })
    const { disputeId, resolution, notes } = req.body
    const dispute = await Dispute.findById(disputeId).populate('escrow')

    if (resolution === 'refund') {
      // Process Razorpay refund to renter
      await processRazorpayRefund(dispute.escrow.paymentId, dispute.escrow.amount)
      await Escrow.findByIdAndUpdate(dispute.escrow._id, { status: 'refunded' })
      await Booking.findByIdAndUpdate(dispute.booking, { status: 'cancelled', paymentStatus: 'refunded' })
    } else {
      // Release to owner
      await Escrow.findByIdAndUpdate(dispute.escrow._id, { status: 'released' })
      await Booking.findByIdAndUpdate(dispute.booking, { status: 'active' })
    }
    await Dispute.findByIdAndUpdate(disputeId, {
      status: resolution === 'refund' ? 'resolved_refund' : 'resolved_release',
      resolvedBy: req.user._id,
      resolvedAt: new Date(),
      notes,
    })
    return res.json({ success: true, message: 'Dispute resolved' })
  }

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET ALL DISPUTES — admin panel
// ─────────────────────────────────────────────────────────────────────────────
export const getAllDisputes = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const disputes = await Dispute.find()
      .populate({ path: 'booking', populate: [{ path: 'car' }, { path: 'user', select: '-password' }] })
      .populate('raisedBy', '-password')
      .populate('escrow')
      .sort({ createdAt: -1 })

    return res.json({ success: true, disputes })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. SUBMIT OWNER VERIFICATION — owner uploads docs before listing
// ─────────────────────────────────────────────────────────────────────────────
export const submitOwnerVerification = async (req, res) => {
  const { aadharNumber, vehicleRegNo } = req.body
  const { aadharImage, rcImage, selfieImage } = req.files

  // Upload each file to ImageKit
  const uploadToImageKit = async (buffer, name) => {
    const result = await imagekit.upload({ file: buffer, fileName: name })
    return result.url
  }

  const [aadharUrl, rcUrl, selfieUrl] = await Promise.all([
    uploadToImageKit(aadharImage[0].buffer, 'aadhar_' + req.user._id),
    uploadToImageKit(rcImage[0].buffer,     'rc_'     + req.user._id),
    uploadToImageKit(selfieImage[0].buffer, 'selfie_' + req.user._id),
  ])

  await User.findByIdAndUpdate(req.user._id, {
    'ownerVerification.status':       'pending',
    'ownerVerification.aadharNumber': aadharNumber,
    'ownerVerification.vehicleRegNo': vehicleRegNo,
    'ownerVerification.aadharImage':  aadharUrl,
    'ownerVerification.rcImage':      rcUrl,
    'ownerVerification.selfieImage':  selfieUrl,
    'ownerVerification.submittedAt':  new Date(),
  })
  return res.json({ success: true, message: 'Documents submitted. Pending review.' })
}


// ─────────────────────────────────────────────────────────────────────────────
// 9. ADMIN — APPROVE or REJECT owner verification
// ─────────────────────────────────────────────────────────────────────────────
export const reviewOwnerVerification = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const { userId, decision, rejectReason } = req.body
    // decision: 'approved' or 'rejected'

    if (decision === 'approved') {
      await User.findByIdAndUpdate(userId, {
        role: 'owner',                                      // ← promote to owner
        'ownerVerification.status':     'verified',
        'ownerVerification.verifiedAt': new Date(),
      })
      return res.json({ success: true, message: 'Owner verified. They can now list cars.' })

    } else if (decision === 'rejected') {
      await User.findByIdAndUpdate(userId, {
        'ownerVerification.status':       'rejected',
        'ownerVerification.rejectedAt':   new Date(),
        'ownerVerification.rejectReason': rejectReason || 'Documents unclear or invalid',
      })
      return res.json({ success: true, message: 'Owner verification rejected.' })

    } else {
      return res.json({ success: false, message: 'Invalid decision. Use "approved" or "rejected"' })
    }

  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. ADMIN — GET all pending verifications
// ─────────────────────────────────────────────────────────────────────────────
export const getPendingVerifications = async (req, res) => {
  if (req.user.role !== 'admin') return res.json({ success: false, message: 'Unauthorized' })
  const users = await User.find({ 'ownerVerification.status': 'pending' })
    .select('name email ownerVerification createdAt')
    .sort({ 'ownerVerification.submittedAt': -1 })
  return res.json({ success: true, users })
}

export const approveOwnerVerification = async (req, res) => {
  if (req.user.role !== 'admin') return res.json({ success: false, message: 'Unauthorized' })
  const { userId } = req.body
  await User.findByIdAndUpdate(userId, {
    role: 'owner',
    'ownerVerification.status':     'verified',
    'ownerVerification.reviewedAt': new Date(),
  })
  // Send approval email to owner...
  return res.json({ success: true, message: 'Owner verified successfully' })
}

export const rejectOwnerVerification = async (req, res) => {
  if (req.user.role !== 'admin') return res.json({ success: false, message: 'Unauthorized' })
  const { userId, rejectionNote } = req.body
  await User.findByIdAndUpdate(userId, {
    'ownerVerification.status':        'rejected',
    'ownerVerification.rejectionNote': rejectionNote,
    'ownerVerification.reviewedAt':    new Date(),
  })
  // Send rejection email with rejectionNote...
  return res.json({ success: true, message: 'Verification rejected' })
}





