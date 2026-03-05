// server/cron/escrowRefundJob.js
// Runs every hour and automatically refunds bookings where the owner
// did not verify the pickup OTP within 24 hours of the pickup date.

import cron  from 'node-cron'
import Escrow from '../models/Escrow.js'
import Booking from '../models/Booking.js'
import { refundEscrow } from '../controllers/escrowController.js'

// ── Schedule: every hour on the hour ─────────────────────────────────────
// Change to '*/15 * * * *' during development/testing (every 15 min)
cron.schedule('0 * * * *', async () => {
  console.log('\n⏱  [CRON] Running escrow auto-refund check…', new Date().toISOString())

  try {
    // Find all escrows that are still held but past their refund deadline
    const expiredEscrows = await Escrow.find({
      status:         'held',
      refundDeadline: { $lt: new Date() },
    }).populate('booking')

    if (expiredEscrows.length === 0) {
      console.log('✅ [CRON] No expired escrows found.')
      return
    }

    console.log(`[CRON] Found ${expiredEscrows.length} expired escrow(s)`)

    for (const escrow of expiredEscrows) {
      const booking = escrow.booking

      // If OTP was verified already (edge case), just release
      if (booking?.otpVerified) {
        await Escrow.findByIdAndUpdate(escrow._id, {
          status:     'released',
          releasedAt: new Date(),
          notes:      'Auto-released by cron — OTP was already verified',
        })
        console.log(`[CRON] Auto-released escrow ${escrow._id} (OTP was verified)`)
        continue
      }

      // Auto-refund to renter
      await refundEscrow(
        escrow._id,
        'auto_refund: owner did not verify OTP within 24 hours of pickup date'
      )
      console.log(`[CRON] Auto-refunded escrow ${escrow._id} for booking ${booking?._id}`)
    }
  } catch (error) {
    console.error('[CRON] Error in escrow auto-refund job:', error.message)
  }
})

console.log('Escrow auto-refund cron job started (runs every hour)')
