import express from 'express'
import { protect } from '../middlewares/auth.js'
import {
  checkAvailabilityCars,
  createBooking,
  getUserBookings,
  getOwnerBookings,
  changeBookingStatus,
  cancelBooking,
  verifyPickupOtp,
  raiseDispute, 
} from '../controllers/bookingController.js'

const bookingRouter = express.Router()

bookingRouter.post('/check-availability',  protect, checkAvailabilityCars)
bookingRouter.post('/create',              protect, createBooking)
bookingRouter.get('/user',                 protect, getUserBookings)
bookingRouter.get('/owner',                protect, getOwnerBookings)
bookingRouter.post('/change-status',       protect, changeBookingStatus)
bookingRouter.post('/cancel',              protect, cancelBooking)
bookingRouter.post('/verify-otp',          protect, verifyPickupOtp)
bookingRouter.post('/raise-dispute',       protect, raiseDispute) 

export default bookingRouter