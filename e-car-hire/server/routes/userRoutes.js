import express from 'express'
import {
  registerUser,
  loginUser,
  getUserData,
  getCars,
  updateProfile,
  paymentRazorpay,
  verifyPayment,
  forgotPassword,      
  verifyResetOtp,      
  resetPassword,       
} from '../controllers/userController.js'
import { createBooking, cancelBooking, getUserBookings, verifyPickupOtp } from '../controllers/bookingController.js'
import { updateUserImage } from '../controllers/ownerController.js'
import { protect } from '../middlewares/auth.js'
import multer from 'multer'

const upload = multer({ dest: 'uploads/' })

const userRouter = express.Router()

// ── Auth
userRouter.post('/register',           registerUser)
userRouter.post('/login',              loginUser)
userRouter.get('/data',         protect, getUserData)

// ── Forgot Password (no auth needed)
userRouter.post('/forgot-password',    forgotPassword)   // ✅ Step 1 — send OTP
userRouter.post('/verify-reset-otp',   verifyResetOtp)   // ✅ Step 2 — verify OTP
userRouter.post('/reset-password',     resetPassword)    // ✅ Step 3 — set new password

// ── Cars & Profile
userRouter.get('/cars',                getCars)
userRouter.put('/user-profile', protect, updateProfile)
userRouter.post('/update-image', protect, upload.single('image'), updateUserImage)

// ── Bookings
userRouter.post('/book-car',    protect, createBooking)
userRouter.post('/cancel-booking', protect, cancelBooking)
userRouter.get('/my-bookings',  protect, getUserBookings)

// ── Payments
userRouter.post('/payment-razorpay', protect, paymentRazorpay)
userRouter.post('/verify-payment',   protect, verifyPayment)
userRouter.post('/verify-otp',       protect, verifyPickupOtp)

export default userRouter