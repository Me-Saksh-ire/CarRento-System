import express from 'express'
import { protect } from '../middlewares/auth.js'
import { upload } from '../configs/cloudinary.js' // ✅ use this, nothing else

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

// ── Escrow ────────────────────────────────────────────────────────────────────
escrowRouter.post('/release', protect, releaseEscrow)

// ── Disputes ──────────────────────────────────────────────────────────────────
escrowRouter.post('/dispute/raise', protect, raiseDispute)
escrowRouter.get('/dispute/mine', protect, getMyDisputes)
escrowRouter.post('/dispute/resolve', protect, resolveDispute)
escrowRouter.get('/dispute/all', protect, getAllDisputes)

// ── Owner Verification ────────────────────────────────────────────────────────
escrowRouter.post(
  '/owner/verify/submit',
  protect,
  upload.fields([                    // ✅ now uses Cloudinary storage
    { name: 'aadharImage', maxCount: 1 },
    { name: 'rcImage', maxCount: 1 },
    { name: 'selfieImage', maxCount: 1 },
  ]),
  submitOwnerVerification
)
escrowRouter.post('/owner/verify/review', protect, reviewOwnerVerification)
escrowRouter.get('/owner/verify/pending', protect, getPendingVerifications)

export default escrowRouter