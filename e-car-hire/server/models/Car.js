import mongoose from 'mongoose'

const { ObjectId } = mongoose.Schema.Types

const carSchema = new mongoose.Schema({

  owner: { type: ObjectId, ref: 'User' },

  brand:            { type: String, required: true },
  model:            { type: String, required: true },
  images:           [{ type: String }],        // ✅ array, was 'image' (string) — fixes admin panel image display
  year:             { type: Number, required: true },
  category:         { type: String, required: true },
  seating_capacity: { type: Number, required: true },
  fuel_type:        { type: String, required: true },
  transmission:     { type: String, required: true },
  pricePerDay:      { type: Number, required: true },
  location:         { type: String, required: true },
  registrationNumber: { type: String, required: true, unique: true },
  description:      { type: String, required: true },
  isAvailable:      { type: Boolean, default: false },  // ✅ default false — only true after admin approves

  // ── Admin Verification ───────────────────────────────────────────────
  isVerified:   { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  verifiedAt:   { type: Date },
  rejectReason: { type: String },

}, { timestamps: true })

const Car = mongoose.model('Car', carSchema)
export default Car