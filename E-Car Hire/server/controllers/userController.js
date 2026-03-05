import User from '../models/User.js'
import Car from "../models/Car.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import razorpay from "razorpay"
import Booking from '../models/Booking.js';
import crypto from 'crypto'
import { sendBookingConfirmationEmail, sendOwnerNotificationEmail, sendPasswordResetEmail  } from '../utils/Emailservice.js'
import { createEscrow } from './escrowController.js'

const generateToken = (userId) => {
  const payload = userId;
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })
}

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password || password.length < 8) {
      return res.json({ success: false, message: "Fill all the fields" })
    }
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.json({ success: false, message: "User already exists!" })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashedPassword })
    const token = generateToken(user._id.toString())
    return res.json({ success: true, token: token })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({ success: false, message: "Missing email and password" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return res.json({ success: true, token: token });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
}

export const getUserData = async (req, res) => {
  try {
    const { user } = req;
    res.json({ success: true, user })
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
}

export const getCars = async (req, res) => {
  try {
    // Only return cars that are both available AND verified by admin
    const cars = await Car.find({ isAvailable: true, isVerified: 'verified' })
    res.json({ success: true, cars })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

export const paymentRazorpay = async (req, res) => {
  try {
    const { bookingId } = req.body

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET_KEY) {
      return res.json({ success: false, message: 'Payment gateway not configured. Contact admin.' })
    }

    const razorpayInstance = new razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET_KEY,
    })

    const bookingData = await Booking.findById(bookingId)

    if (!bookingData) return res.json({ success: false, message: 'Booking not found' })
    if (bookingData.status === 'cancelled') return res.json({ success: false, message: 'Booking has been cancelled' })
    if (bookingData.paymentStatus === 'paid') return res.json({ success: false, message: 'Booking is already paid' })
    if (bookingData.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Unauthorized' })

    const options = {
      amount: Math.round(bookingData.price * 100), // paise
      currency: process.env.CURRENCY || 'INR',
      receipt: bookingId.toString(),
    }

    const order = await razorpayInstance.orders.create(options)
    await Booking.findByIdAndUpdate(bookingId, { orderId: order.id })

    return res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID })
  } catch (error) {
    console.error('[paymentRazorpay]', error.message)
    return res.json({ success: false, message: error.message })
  }
}

export const verifyPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body

    // 1. Verify HMAC signature
    const sign = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
      .update(sign)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' })
    }

    // 2. Find booking — orderId first, fallback to bookingId
    let booking = await Booking.findOne({ orderId: razorpay_order_id })
      .populate('car').populate('user', '-password')

    if (!booking && bookingId) {
      booking = await Booking.findById(bookingId)
        .populate('car').populate('user', '-password')
      if (booking) await Booking.findByIdAndUpdate(bookingId, { orderId: razorpay_order_id })
    }

    if (!booking) return res.json({ success: false, message: 'Booking not found' })
    if (booking.paymentStatus === 'paid') return res.json({ success: true, message: 'Payment already recorded' })

    // 3. Generate OTP and update booking
    const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString()

    const updatedBooking = await Booking.findByIdAndUpdate(
      booking._id,
      { paymentStatus: 'paid', status: 'confirmed', paymentId: razorpay_payment_id, pickupOtp },
      { new: true }
    ).populate('car').populate('user', '-password')

    // 4. Create escrow
    await createEscrow(updatedBooking, razorpay_payment_id)

    // 5. Send emails (non-fatal)
    try {
      // ── Email to renter ──────────────────────────────────────────────────
      await sendBookingConfirmationEmail(updatedBooking.user.email, {
        userName:   updatedBooking.user.name,
        carName:    `${updatedBooking.car.brand} ${updatedBooking.car.model}`,
        pickupDate: new Date(updatedBooking.pickupDate).toDateString(),
        returnDate: new Date(updatedBooking.returnDate).toDateString(),
        totalPrice: updatedBooking.price,
        bookingId:  updatedBooking._id,
        pickupOtp,  // ✅ OTP sent to renter
      })

      // ── Email to owner ───────────────────────────────────────────────────
      const ownerUser = await User.findById(updatedBooking.owner).select('name email')
      if (ownerUser) {
        await sendOwnerNotificationEmail(ownerUser.email, {
          ownerName:      ownerUser.name || 'Owner',
          carName:        `${updatedBooking.car.brand} ${updatedBooking.car.model}`,
          renterName:     updatedBooking.user.name,
          renterEmail:    updatedBooking.user.email,
          renterPhone:    updatedBooking.user.phone     || 'Not provided',
          renterLicence:  updatedBooking.user.licenceNumber || 'Not provided',
          renterAddress:  updatedBooking.user.address   || 'Not provided',
          pickupLocation: updatedBooking.pickupLocation || updatedBooking.car.location,
          carLocation:    updatedBooking.car.location,
          pickupDate:     new Date(updatedBooking.pickupDate).toDateString(),
          returnDate:     new Date(updatedBooking.returnDate).toDateString(),
          totalPrice:     updatedBooking.price,
          bookingId:      updatedBooking._id,
          pickupOtp,      // ✅ OTP also sent to owner so they can verify at handover
        })
      }
    } catch (emailErr) {
      console.error('[verifyPayment] Email error (non-fatal):', emailErr.message)
    }

    return res.json({ success: true, message: 'Payment verified. OTP sent to your email. 🔒 Money held in escrow.' })
  } catch (error) {
    console.error('[verifyPayment]', error.message)
    return res.json({ success: false, message: error.message })
  }
}

export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, licenceNumber, address } = req.body
    const userId = req.user._id

    if (!name?.trim()) return res.json({ success: false, message: 'Name cannot be empty' })

    const existingUser = await User.findById(userId)
    if (!existingUser) return res.json({ success: false, message: 'User not found' })

    // ── Flat profile fields ───────────────────────────────────────────────────
    const updateFields = { name, email, phone, licenceNumber, address }

    // ── Auto-submit renterVerification when licence number is saved ───────────
    if (licenceNumber?.trim()) {
      const currentStatus = existingUser.renterVerification?.status

      if (
        !currentStatus ||
        currentStatus === 'not_submitted' ||
        currentStatus === 'rejected'
      ) {
        updateFields['renterVerification.status']        = 'pending'
        updateFields['renterVerification.licenceNumber'] = licenceNumber.trim()
        updateFields['renterVerification.submittedAt']   = new Date()
        updateFields['renterVerification.rejectReason']  = null
        console.log('📋 renterVerification → pending for', existingUser.email)
      } else {
        updateFields['renterVerification.licenceNumber'] = licenceNumber.trim()
        console.log('📋 renterVerification already', currentStatus, '— syncing licenceNumber only')
      }
    } else {
      updateFields['renterVerification.status']        = 'not_submitted'
      updateFields['renterVerification.licenceNumber'] = null
      updateFields['renterVerification.submittedAt']   = null
      console.log('📋 licenceNumber cleared → renterVerification reset to not_submitted')
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    ).select('-password')

    console.log('✅ saved renterVerification:', user.renterVerification)

    return res.json({ success: true, user })
  } catch (error) {
    console.log('❌ updateProfile error:', error.message)
    return res.json({ success: false, message: error.message })
  }
}

// STEP 1 — POST /api/user/forgot-password  { email }
// Generates a 6-digit OTP, saves it with 10-min expiry, sends email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.json({ success: false, message: 'Email is required' })

    const user = await User.findOne({ email })
    if (!user) {
      return res.json({ success: true, message: 'If this email is registered, an OTP has been sent.' })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await User.findByIdAndUpdate(user._id, {
      resetOtp:       otp,
      resetOtpExpiry: otpExpiry,
    })

    await sendPasswordResetEmail(email, { userName: user.name, otp })

    return res.json({ success: true, message: 'OTP sent to your email. Valid for 10 minutes.' })
  } catch (error) {
    console.log('❌ forgotPassword error:', error.message)
    return res.json({ success: false, message: error.message })
  }
}

// STEP 2 — POST /api/user/verify-reset-otp  { email, otp }
// Verifies OTP is correct and not expired — returns a short-lived reset token
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) return res.json({ success: false, message: 'Email and OTP are required' })

    const user = await User.findOne({ email })
    if (!user || !user.resetOtp) {
      return res.json({ success: false, message: 'Invalid or expired OTP' })
    }

    if (user.resetOtp !== otp) {
      return res.json({ success: false, message: 'Incorrect OTP. Please try again.' })
    }

    if (new Date() > new Date(user.resetOtpExpiry)) {
      return res.json({ success: false, message: 'OTP has expired. Please request a new one.' })
    }

    // OTP valid — issue a short-lived reset token (valid 15 min)
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    // Clear OTP after successful verification
    await User.findByIdAndUpdate(user._id, {
      resetOtp: null,
      resetOtpExpiry: null,
    })

    return res.json({ success: true, resetToken, message: 'OTP verified. You can now set a new password.' })
  } catch (error) {
    console.log('❌ verifyResetOtp error:', error.message)
    return res.json({ success: false, message: error.message })
  }
}

// STEP 3 — POST /api/user/reset-password  { resetToken, newPassword }
// Verifies reset token and updates password
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body

    if (!resetToken || !newPassword) {
      return res.json({ success: false, message: 'Reset token and new password are required' })
    }

    if (newPassword.length < 8) {
      return res.json({ success: false, message: 'Password must be at least 8 characters' })
    }

    // Verify reset token
    let decoded
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET)
    } catch (err) {
      return res.json({ success: false, message: 'Reset link has expired. Please start over.' })
    }

    if (decoded.purpose !== 'password_reset') {
      return res.json({ success: false, message: 'Invalid reset token' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await User.findByIdAndUpdate(decoded.userId, {
      password: hashedPassword,
      resetOtp: null,
      resetOtpExpiry: null,
    })

    return res.json({ success: true, message: 'Password reset successfully! You can now log in.' })
  } catch (error) {
    console.log('❌ resetPassword error:', error.message)
    return res.json({ success: false, message: error.message })
  }
}