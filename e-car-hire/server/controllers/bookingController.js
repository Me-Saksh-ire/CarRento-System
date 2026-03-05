import Booking from '../models/Booking.js'
import Car     from '../models/Car.js'
import User    from '../models/User.js'
import Escrow  from '../models/Escrow.js'
import razorpay from 'razorpay'
import { sendBookingCancellationEmail, sendStatusChangeEmail, sendBookingRefundEmail } from '../utils/Emailservice.js'

// ── Razorpay instance ────────────────────────────────────────────────────────
const getRazorpay = () => new razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
})

export const checkAvailability = async (car, pickupDate, returnDate) => {
  const bookings = await Booking.find({
    car,
    status:     { $ne: 'cancelled' },
    pickupDate: { $lte: returnDate },
    returnDate: { $gte: pickupDate },
  })
  return bookings.length === 0
}

export const checkAvailabilityCars = async (req, res) => {
  try {
    const { location, pickupDate, returnDate } = req.body
    const cars = await Car.find({ location, isAvailable: true })

    const results = await Promise.all(
      cars.map(async (car) => {
        const isAvailable = await checkAvailability(car.id, pickupDate, returnDate)
        return { ...car._doc, isAvailable }
      })
    )

    res.json({ success: true, availableCars: results.filter(c => c.isAvailable) })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

export const createBooking = async (req, res) => {
  try {
    const { _id } = req.user

    const user = await User.findById(_id).select('phone licenceNumber')
    if (!user.phone || !user.licenceNumber) {
      return res.json({
        success: false,
        message: 'Please complete your profile (phone + driving licence) before booking.',
      })
    }

    const { car, pickupDate, returnDate, pickupLocation } = req.body

    const isAvailable = await checkAvailability(car, pickupDate, returnDate)
    if (!isAvailable) return res.json({ success: false, message: 'Car is not available for selected dates' })

    const carData = await Car.findById(car)
    if (!carData) return res.json({ success: false, message: 'Car not found' })

    const days  = Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24))
    const price = carData.pricePerDay * days

    await Booking.create({ car, owner: carData.owner, user: _id, pickupDate, returnDate, price, pickupLocation })

    return res.json({ success: true, message: 'Booking Created' })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('car')
      .sort({ createdAt: -1 })
    res.json({ success: true, bookings })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

export const getOwnerBookings = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const bookings = await Booking.find({ owner: req.user._id })
      .populate('car')
      .populate('user', '-password')
      .sort({ createdAt: -1 })

    res.json({ success: true, bookings })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

export const changeBookingStatus = async (req, res) => {
  try {
    const { _id } = req.user
    const { bookingId, status } = req.body

    const booking = await Booking.findById(bookingId)
    if (!booking) return res.json({ success: false, message: 'Booking not found' })
    if (booking.owner.toString() !== _id.toString())
      return res.json({ success: false, message: 'Unauthorized' })

    booking.status = status
    await booking.save()

    const populated = await Booking.findById(bookingId)
      .populate('car')
      .populate('user', '-password')

    await sendStatusChangeEmail(populated.user.email, {
      userName:   populated.user.name,
      carName:    `${populated.car.brand} ${populated.car.model}`,
      pickupDate: new Date(populated.pickupDate).toDateString(),
      returnDate: new Date(populated.returnDate).toDateString(),
      totalPrice: populated.price,
      bookingId,
      status,
    })

    res.json({ success: true, message: 'Status Updated' })
  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}

// ── CANCEL BOOKING with automatic Razorpay refund if already paid ─────────────
export const cancelBooking = async (req, res) => {
  try {
    const { _id } = req.user
    const { bookingId } = req.body

    const booking = await Booking.findById(bookingId)
      .populate('car')
      .populate('user', '-password')

    if (!booking)                                        return res.json({ success: false, message: 'Booking not found' })
    if (booking.user._id.toString() !== _id.toString()) return res.json({ success: false, message: 'Unauthorized' })
    if (booking.status === 'cancelled')                  return res.json({ success: false, message: 'Already cancelled' })
    if (booking.status === 'completed')                  return res.json({ success: false, message: 'Completed bookings cannot be cancelled' })
    if (booking.otpVerified)                             return res.json({ success: false, message: 'Car already handed over — cannot cancel' })

    let refundProcessed = false
    let refundId = null

    // ── If paid → process Razorpay refund ────────────────────────────────────
    if (booking.paymentStatus === 'paid') {
      const escrow = await Escrow.findOne({ booking: bookingId, status: 'held' })

      if (escrow && escrow.paymentId) {
        try {
          const rz = getRazorpay()
          const refund = await rz.payments.refund(escrow.paymentId, {
            amount: escrow.amount * 100, // paise
            speed:  'normal',
            notes:  { reason: 'User cancelled booking', bookingId: bookingId.toString() }
          })

          // Mark escrow as refunded
          await Escrow.findByIdAndUpdate(escrow._id, {
            status:           'refunded',
            refundedAt:       new Date(),
            razorpayRefundId: refund.id,
            notes:            'Refunded — user cancelled booking',
          })

          refundProcessed = true
          refundId = refund.id
          console.log(`✅ Razorpay refund processed: ${refund.id} for ₹${escrow.amount}`)
        } catch (refundErr) {
          console.log('❌ Razorpay refund failed:', refundErr.message)
          // Still cancel the booking but flag the refund failure
          return res.json({
            success: false,
            message: `Refund failed: ${refundErr.message}. Please contact support.`
          })
        }
      }

      // Update booking payment status
      await Booking.findByIdAndUpdate(bookingId, {
        status:        'cancelled',
        paymentStatus: 'refunded',
      })
    } else {
      // Not paid — just cancel
      await Booking.findByIdAndUpdate(bookingId, { status: 'cancelled' })
    }

    // ── Send cancellation/refund email ───────────────────────────────────────────────
    try {
      if (refundProcessed && refundId) {
        // Send refund-specific email with refund ID
        await sendBookingRefundEmail(booking.user.email, {
          userName:   booking.user.name,
          carName:    `${booking.car.brand} ${booking.car.model}`,
          pickupDate: new Date(booking.pickupDate).toDateString(),
          returnDate: new Date(booking.returnDate).toDateString(),
          totalPrice: booking.price,
          bookingId,
          refundId,
        })
      } else {
        // Send generic cancellation email
        await sendBookingCancellationEmail(booking.user.email, {
          userName:   booking.user.name,
          carName:    `${booking.car.brand} ${booking.car.model}`,
          pickupDate: new Date(booking.pickupDate).toDateString(),
          returnDate: new Date(booking.returnDate).toDateString(),
          totalPrice: booking.price,
          bookingId,
        })
      }
    } catch (emailErr) {
      console.log('❌ Email error (non-fatal):', emailErr.message)
    }

    return res.json({
      success: true,
      message: refundProcessed
        ? `Booking cancelled. ₹${booking.price.toLocaleString('en-IN')} refund initiated — will reach your account in 5-7 business days. Refund ID: ${refundId}`
        : 'Booking cancelled successfully.',
    })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

// ── VERIFY PICKUP OTP — owner verifies at handover, releases escrow ───────────
export const verifyPickupOtp = async (req, res) => {
  try {
    const { bookingId, otp } = req.body
    const ownerId = req.user._id

    const booking = await Booking.findById(bookingId)
    if (!booking)
      return res.json({ success: false, message: 'Booking not found' })
    if (booking.owner.toString() !== ownerId.toString())
      return res.json({ success: false, message: 'Unauthorized' })
    if (booking.otpVerified)
      return res.json({ success: false, message: 'OTP already used — car already handed over' })
    if (booking.pickupOtp !== otp)
      return res.json({ success: false, message: 'Invalid OTP. Please ask the renter to check their email.' })

    // Mark OTP verified + completed
    await Booking.findByIdAndUpdate(bookingId, {
      otpVerified:   true,
      otpVerifiedAt: new Date(),
      status:        'completed',
    })

    // Release escrow
    const escrow = await Escrow.findOne({ booking: bookingId, status: 'held' })
    if (escrow) {
      await Escrow.findByIdAndUpdate(escrow._id, {
        status:     'released',
        releasedAt: new Date(),
        notes:      'Released after OTP verified at pickup',
      })
      console.log(`✅ Escrow released ₹${escrow.amount} to owner ${ownerId}`)
    }

    return res.json({
      success: true,
      message: `OTP verified! Car handed over successfully. ₹${
        escrow?.amount?.toLocaleString('en-IN') || booking.price?.toLocaleString('en-IN')
      } will be credited to your account within 2-3 business days.`,
    })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

// ── RAISE DISPUTE — renter reports owner didn't show up ──────────────────────
// Conditions: booking confirmed + paid + pickup date passed + OTP not verified
export const raiseDispute = async (req, res) => {
  try {
    const { bookingId, reason } = req.body
    const userId = req.user._id

    const booking = await Booking.findById(bookingId)

    if (!booking)
      return res.json({ success: false, message: 'Booking not found' })
    if (booking.user.toString() !== userId.toString())
      return res.json({ success: false, message: 'Unauthorized — only the renter can raise a dispute' })
    if (booking.paymentStatus !== 'paid')
      return res.json({ success: false, message: 'No payment found for this booking' })
    if (booking.otpVerified)
      return res.json({ success: false, message: 'Car was already handed over — cannot raise dispute' })
    if (booking.status === 'cancelled')
      return res.json({ success: false, message: 'Booking is already cancelled' })
    if (booking.hasDispute)
      return res.json({ success: false, message: 'A dispute has already been raised for this booking' })

    // Must be past pickup date
    const now = new Date()
    const pickup = new Date(booking.pickupDate)
    if (now < pickup)
      return res.json({ success: false, message: 'Cannot raise dispute before the pickup date' })

    const escrow = await Escrow.findOne({ booking: bookingId, status: 'held' })
    if (!escrow)
      return res.json({ success: false, message: 'No active escrow found. May have already been refunded.' })

    // ── Auto-refund immediately on dispute (for college project simplicity) ────
    // In production you would put this in 'disputed' state for admin review
    try {
      const rz = getRazorpay()
      const refund = await rz.payments.refund(escrow.paymentId, {
        amount: escrow.amount * 100,
        speed:  'normal',
        notes:  { reason: 'Owner no-show dispute', bookingId: bookingId.toString() }
      })

      await Escrow.findByIdAndUpdate(escrow._id, {
        status:           'refunded',
        refundedAt:       new Date(),
        razorpayRefundId: refund.id,
        notes:            `Refunded — dispute: ${reason || 'owner did not show up'}`,
      })

      await Booking.findByIdAndUpdate(bookingId, {
        status:        'cancelled',
        paymentStatus: 'refunded',
        hasDispute:    true,
      })

      // Send refund email to renter
      const populated = await Booking.findById(bookingId)
        .populate('car')
        .populate('user', '-password')

      await sendBookingRefundEmail(populated.user.email, {
        userName:   populated.user.name,
        carName:    `${populated.car.brand} ${populated.car.model}`,
        pickupDate: new Date(populated.pickupDate).toDateString(),
        returnDate: new Date(populated.returnDate).toDateString(),
        totalPrice: populated.price,
        bookingId,
        refundId:   refund.id,
      })

      console.log(`✅ Dispute refund processed: ${refund.id} for booking ${bookingId}`)

      return res.json({
        success: true,
        message: `Dispute accepted. ₹${escrow.amount.toLocaleString('en-IN')} refund initiated — will reach your account in 5-7 business days.`,
        refundId: refund.id,
      })

    } catch (refundErr) {
      console.log('❌ Dispute refund failed:', refundErr.message)

      // Mark escrow as disputed for manual admin review
      await Escrow.findByIdAndUpdate(escrow._id, { status: 'disputed' })
      await Booking.findByIdAndUpdate(bookingId, { hasDispute: true })

      return res.json({
        success: true,
        message: 'Dispute raised. Automatic refund failed — our team will manually process your refund within 24 hours.',
      })
    }

  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}