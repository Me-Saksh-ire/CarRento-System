import express from 'express'
import { protect } from '../middlewares/auth.js'
import multer from 'multer'
import {
  releaseEscrow,
  raiseDispute,
  getMyDisputes,
  resolveDispute,
  getAllDisputes,
  submitOwnerVerification,
  reviewOwnerVerification,
  getPendingVerifications,
} from '../controllers/escrowController.js'

const escrowRouter = express.Router()

// Multer for owner verification doc uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
})
const upload = multer({ storage })

// ── Escrow ────────────────────────────────────────────────────────────────────
// Release payment to owner (called after OTP verify — optional manual trigger)
escrowRouter.post('/release',        protect, releaseEscrow)

// ── Disputes ─────────────────────────────────────────────────────────────────
// Renter raises a dispute
escrowRouter.post('/dispute/raise',  protect, raiseDispute)
// Renter views their disputes
escrowRouter.get('/dispute/mine',    protect, getMyDisputes)
// Admin resolves a dispute
escrowRouter.post('/dispute/resolve',protect, resolveDispute)
// Admin views all disputes
escrowRouter.get('/dispute/all',     protect, getAllDisputes)

// ── Owner Verification ────────────────────────────────────────────────────────
// Owner submits docs (aadharImage, rcImage, selfieImage)
escrowRouter.post(
  '/owner/verify/submit',
  protect,
  upload.fields([
    { name: 'aadharImage', maxCount: 1 },
    { name: 'rcImage',     maxCount: 1 },
    { name: 'selfieImage', maxCount: 1 },
  ]),
  submitOwnerVerification
)
// Admin approves/rejects owner
escrowRouter.post('/owner/verify/review', protect, reviewOwnerVerification)
// Admin views pending verifications
escrowRouter.get('/owner/verify/pending', protect, getPendingVerifications)

export default escrowRouter
