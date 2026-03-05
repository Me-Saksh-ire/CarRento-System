import mongoose from 'mongoose';
const disputeSchema = new mongoose.Schema({
  booking:     { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  escrow:      { type: mongoose.Schema.Types.ObjectId, ref: 'Escrow' },
  raisedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },   // renter
  reason:      { type: String, enum: ['owner_no_show','car_condition_mismatch','wrong_car','owner_unresponsive','other'] },
  description: String,
  status:      { type: String, enum: ['open','under_review','resolved_refund','resolved_release'], default: 'open' },
  resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },   // admin
  resolvedAt:  Date,
  notes:       String,
}, { timestamps: true });
export default mongoose.model('Dispute', disputeSchema);
