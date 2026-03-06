import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({

  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  image: { type: String },

  // role: 'user' = renter, 'owner' = car owner, 'admin' = platform admin
  role: { type: String, enum: ['user', 'owner', 'admin'], default: 'user' },

  // ── Profile fields (used by renter at booking) ──────────────────────
  phone: { type: String },
  licenceNumber: { type: String },
  address: { type: String },

  // ── Owner identity & bank details (saved on submit-verification) ────
  aadharNumber: { type: String },
  panNumber: { type: String },
  bankAccount: { type: String },
  ifscCode: { type: String },
  upiId: { type: String },

  // ── Owner Verification ──────────────────────────────────────────────
  ownerVerification: {
    status: { type: String, enum: ['not_submitted', 'pending', 'verified', 'rejected'], default: 'not_submitted' },
    aadharNumber: String,
    aadharImage: String,  
    rcImage: String,      
    selfieImage: String,  
    submittedAt: Date,
    reviewedAt: Date,
    rejectReason: String,
  },

  // ── Renter Verification ─────────────────────────────────────────────
  renterVerification: {
    status: { type: String, enum: ['not_submitted', 'pending', 'verified', 'rejected'], default: 'not_submitted' },
    licenceNumber: String,
    licenceImage: String, 
    submittedAt: Date,
    reviewedAt: Date,
    rejectReason: String,
  },

  // ── Password Reset OTP ──────────────────────────────────────────────
  // ✅ FIXED: must be at root level so controller can find/update them
  resetOtp:       { type: String, default: null },
  resetOtpExpiry: { type: Date,   default: null },

  // ── Balance (simulated) ─────────────────────────────────────────────
  availableBalance: { type: Number, default: 0 },

}, { timestamps: true })

const User = mongoose.model('User', userSchema)
export default User