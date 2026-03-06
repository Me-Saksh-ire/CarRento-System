import express from 'express'
import { protect } from '../middlewares/auth.js'
import { upload } from '../configs/cloudinary.js'

import {
  addCar,
  getOwnerCars,
  toggleCarAvailability,
  deleteCar,
  changeRoleToOwner,
  getDashboardData,
  getOwnerDashboard,
  updateUserImage,
  verifyPickupOtp,
  ownerProfile,
  submitVerification,
} from '../controllers/ownerController.js'

const ownerRouter = express.Router()

ownerRouter.post('/change-role', protect, changeRoleToOwner)
ownerRouter.post('/add-car', protect, upload.single('image'), addCar)       // ✅ Cloudinary
ownerRouter.get('/car', protect, getOwnerCars)
ownerRouter.post('/toggle-car', protect, toggleCarAvailability)
ownerRouter.post('/delete-car', protect, deleteCar)
ownerRouter.get('/dashboard', protect, getOwnerDashboard)
ownerRouter.post('/update-image', protect, upload.single('image'), updateUserImage) // ✅ Cloudinary
ownerRouter.post('/verify-otp', protect, verifyPickupOtp)
ownerRouter.post('/owner-profile', protect, ownerProfile)

ownerRouter.post(
  '/submit-verification',
  protect,
  upload.fields([                   // ✅ Cloudinary
    { name: 'aadharDoc', maxCount: 1 },
    { name: 'rcBook', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  submitVerification
)

export default ownerRouter