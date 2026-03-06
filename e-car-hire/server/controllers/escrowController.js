import Booking from '../models/Booking.js'
import Escrow  from '../models/Escrow.js'
import Dispute from '../models/Dispute.js'
import User    from '../models/User.js'
import razorpay from 'razorpay'
import { uploadToCloudinary } from '../configs/cloudinary.js'
import { sendBookingCancellationEmail, sendBookingRefundEmail } from '../utils/Emailservice.js'

// HELPER — Razorpay instance
const getRazorpay = () => new razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
})

// HELPER — Process Razorpay refund
const processRazorpayRefund = async (paymentId, amount) => {
  const rz = getRazorpay()
  const refund = await rz.payments.refund(paymentId, {
    amount: amount * 100,
    speed: 'normal',
    notes: { reason: 'CarRento escrow refund' }
  })
  return refund
}

// 1. CREATE ESCROW
export const createEscrow = async (booking, paymentId) => {
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

  await Booking.findByIdAndUpdate(booking._id, { escrow: escrow._id })
  console.log(`✅ Escrow created: Rs.${booking.price} held for booking ${booking._id}`)
  return escrow
}

// 2. RELEASE ESCROW
export const releaseEscrow = async (req, res) => {
  try {
    const { bookingId } = req.body
    const ownerId = req.user._id

    const booking = await Booking.findById(bookingId).populate('escrow')
    if (!booking) return res.json({ success: false, message: 'Booking not found' })
    if (booking.owner.toString() !== ownerId.toString()) return res.json({ success: false, message: 'Unauthorized' })
    if (!booking.otpVerified) return res.json({ success: false, message: 'OTP must be verified before releasing payment' })

    const escrow = booking.escrow
    if (!escrow || escrow.status !== 'held') return res.json({ success: false, message: 'Escrow not in held state' })

    await Escrow.findByIdAndUpdate(escrow._id, {
      status:     'released',
      releasedAt: new Date(),
      notes:      'Released after successful OTP verification at pickup'
    })

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

// 3. REFUND ESCROW
export const refundEscrow = async (escrowId, reason = 'auto_refund') => {
  try {
    const escrow = await Escrow.findById(escrowId).populate('booking')
    if (!escrow || escrow.status !== 'held') {
      console.log(`⚠️ Escrow ${escrowId} not in held state, skipping refund`)
      return null
    }

    const refund = await processRazorpayRefund(escrow.paymentId, escrow.amount)

    await Escrow.findByIdAndUpdate(escrowId, {
      status:           'refunded',
      refundedAt:       new Date(),
      razorpayRefundId: refund.id,
      notes:            reason
    })

    await Booking.findByIdAndUpdate(escrow.booking._id, {
      status:        'cancelled',
      paymentStatus: 'refunded',
    })

    const booking = await Booking.findById(escrow.booking._id)
      .populate('car')
      .populate('user', '-password')

    await sendBookingRefundEmail(booking.user.email, {
      userName:   booking.user.name,
      carName:    `${booking.car.brand} ${booking.car.model}`,
      pickupDate: new Date(booking.pickupDate).toDateString(),
      returnDate: new Date(booking.returnDate).toDateString(),
      totalPrice: booking.price,
      bookingId:  booking._id.toString(),
      refundId:   refund.id,
    })

    console.log(`✅ Escrow refunded: Rs.${escrow.amount} refunded for booking ${escrow.booking._id}`)
    return refund
  } catch (error) {
    console.log(`❌ Refund failed for escrow ${escrowId}:`, error.message)
    return null
  }
}

// 4. RAISE DISPUTE
export const raiseDispute = async (req, res) => {
  try {
    const { bookingId, reason, description } = req.body
    const userId = req.user._id

    const booking = await Booking.findById(bookingId).populate('escrow')
    if (!booking) return res.json({ success: false, message: 'Booking not found' })
    if (booking.user.toString() !== userId.toString()) return res.json({ success: false, message: 'Only the renter can raise a dispute' })
    if (booking.paymentStatus !== 'paid') return res.json({ success: false, message: 'No payment found for this booking' })
    if (booking.otpVerified) return res.json({ success: false, message: 'Car was already handed over — cannot dispute' })
    if (booking.hasDispute) return res.json({ success: false, message: 'A dispute has already been raised for this booking' })
    if (new Date() < new Date(booking.pickupDate)) return res.json({ success: false, message: 'Cannot raise dispute before pickup date' })

    const escrow = booking.escrow
    if (!escrow) return res.json({ success: false, message: 'No escrow found for this booking' })

    const dispute = await Dispute.create({
      booking:     bookingId,
      escrow:      escrow._id,
      raisedBy:    userId,
      reason,
      description,
      status:      'open'
    })

    await Escrow.findByIdAndUpdate(escrow._id, { status: 'disputed' })
    await Booking.findByIdAndUpdate(bookingId, { hasDispute: true, dispute: dispute._id })

    console.log(`⚠️ Dispute raised: ${dispute._id} for booking ${bookingId}`)
    return res.json({
      success: true,
      message: 'Dispute raised successfully. Our team will review within 24 hours.',
      disputeId: dispute._id
    })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

// 5. GET MY DISPUTES
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

// 6. RESOLVE DISPUTE
export const resolveDispute = async (req, res) => {
  if (req.user.role !== 'admin') return res.json({ success: false, message: 'Unauthorized' })
  const { disputeId, resolution, notes } = req.body
  const dispute = await Dispute.findById(disputeId).populate('escrow')

  if (resolution === 'refund') {
    await processRazorpayRefund(dispute.escrow.paymentId, dispute.escrow.amount)
    await Escrow.findByIdAndUpdate(dispute.escrow._id, { status: 'refunded' })
    await Booking.findByIdAndUpdate(dispute.booking, { status: 'cancelled', paymentStatus: 'refunded' })
  } else {
    await Escrow.findByIdAndUpdate(dispute.escrow._id, { status: 'released' })
    await Booking.findByIdAndUpdate(dispute.booking, { status: 'active' })
  }

  await Dispute.findByIdAndUpdate(disputeId, {
    status:     resolution === 'refund' ? 'resolved_refund' : 'resolved_release',
    resolvedBy: req.user._id,
    resolvedAt: new Date(),
    notes,
  })
  return res.json({ success: true, message: 'Dispute resolved' })
}

// 7. GET ALL DISPUTES
export const getAllDisputes = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.json({ success: false, message: 'Unauthorized' })

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

// 8. SUBMIT OWNER VERIFICATION
export const submitOwnerVerification = async (req, res) => {
  try {
    const { aadharNumber, vehicleRegNo } = req.body
    const { aadharImage, rcImage, selfieImage } = req.files

    // ✅ Upload each doc to Cloudinary using buffer
    const [aadharUrl, rcUrl, selfieUrl] = await Promise.all([
      uploadToCloudinary(aadharImage[0].buffer).then(r => r.secure_url),
      uploadToCloudinary(rcImage[0].buffer).then(r => r.secure_url),
      uploadToCloudinary(selfieImage[0].buffer).then(r => r.secure_url),
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
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

// 9. REVIEW OWNER VERIFICATION
export const reviewOwnerVerification = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.json({ success: false, message: 'Unauthorized' })

    const { userId, decision, rejectReason } = req.body

    if (decision === 'approved') {
      await User.findByIdAndUpdate(userId, {
        role: 'owner',
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

// 10. GET PENDING VERIFICATIONS
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
  return res.json({ success: true, message: 'Verification rejected' })
}