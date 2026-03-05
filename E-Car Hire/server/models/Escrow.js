import mongoose from 'mongoose';
const escrowSchema = new mongoose.Schema({
  booking:          { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  user:             { type: mongoose.Schema.Types.ObjectId, ref: 'User' },   // renter
  owner:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount:           { type: Number, required: true },
  paymentId:        String,   // Razorpay payment_id
  status:           { type: String, enum: ['held','released','refunded','disputed'], default: 'held' },
  refundDeadline:   Date,     // pickup date + 24h; auto-refund if owner misses
  releasedAt:       Date,
  refundedAt:       Date,
  razorpayRefundId: String,
  notes:            String,
}, { timestamps: true });
export default mongoose.model('Escrow', escrowSchema);
