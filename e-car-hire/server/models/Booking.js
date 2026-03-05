import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({

  car:            { type: mongoose.Schema.Types.ObjectId, ref: 'Car',  required: true },
  user:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  pickupDate:     { type: Date,   required: true },
  returnDate:     { type: Date,   required: true },
  price:          { type: Number, required: true },
  pickupLocation: { type: String },

  status: {
    type:    String,
    enum:    ['pending', 'confirmed', 'active', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type:    String,
    enum:    ['pending', 'paid', 'refunded'],
    default: 'pending'
  },

  // ── Razorpay ─────────────────────────────────────────────────────────
  orderId:   { type: String },   
  paymentId: { type: String },  

  // ── OTP & Escrow ──────────────────────────────────────────────────────
  pickupOtp:     { type: String },
  otpVerified:   { type: Boolean, default: false },
  otpVerifiedAt: { type: Date },
  escrow:        { type: mongoose.Schema.Types.ObjectId, ref: 'Escrow' },

  // ── Dispute ───────────────────────────────────────────────────────────
  hasDispute: { type: Boolean, default: false },
  dispute:    { type: mongoose.Schema.Types.ObjectId, ref: 'Dispute' },

}, { timestamps: true })

const Booking = mongoose.model('Booking', bookingSchema)
export default Booking