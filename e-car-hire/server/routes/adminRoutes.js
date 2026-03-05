// server/routes/adminRoutes.js
import express from 'express'
import { protect } from '../middlewares/auth.js'

import {
  adminLogin,
  getAdminDashboard,
  getAllUsers,
  verifyRenter,
  getPendingOwners,
  getAllOwners,
  approveOwner,
  rejectOwner,
  getAllCars,
  approveCar,
  rejectCar,
  getDisputes,
} from "../controllers/adminController.js"

const adminRouter = express.Router()

// ── Auth (no protect needed)
adminRouter.post('/login', adminLogin)

// ── Dashboard
adminRouter.get('/dashboard', protect, getAdminDashboard)

// ── Users / Renters
adminRouter.get('/users', protect, getAllUsers)
adminRouter.post('/users/verify-renter', protect, verifyRenter)

// ── Owner Verification
adminRouter.get('/owners/pending', protect, getPendingOwners)
adminRouter.get('/owners/all', protect, getAllOwners)
adminRouter.post('/owners/approve', protect, approveOwner)
adminRouter.post('/owners/reject', protect, rejectOwner)

// ── Car Verification
adminRouter.get('/cars', protect, getAllCars)
adminRouter.post('/cars/approve', protect, approveCar)
adminRouter.post('/cars/reject', protect, rejectCar)

// ── Disputes
adminRouter.get('/disputes', protect, getDisputes)

export default adminRouter