import nodemailer from 'nodemailer'

export const sendBookingConfirmationEmail = async (toEmail, {
  userName, carName, pickupDate, returnDate, totalPrice, bookingId, pickupOtp
}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
    })

    const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <style>
      body{font-family:Arial,sans-serif;background:#f0f4f8;margin:0}
      .wrap{max-width:600px;margin:20px auto;background:#fff;border-radius:12px;
            overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
      .hdr{background:linear-gradient(135deg,#0558FE,#A9CFFF);color:#fff;padding:28px 32px}
      .hdr h1{margin:0;font-size:22px}
      .hdr p{margin:4px 0 0;opacity:.85;font-size:14px}
      .bd{padding:28px 32px}
      .box{background:#f8f9fa;border-radius:10px;padding:18px;margin:16px 0}
      .box h3{margin:0 0 12px;font-size:13px;color:#555;text-transform:uppercase;letter-spacing:.5px}
      .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:14px}
      .row:last-child{border:none}
      .lbl{color:#888}.val{font-weight:600;color:#222}
      .otp-box{background:#EFF6FF;border:2px solid #3B82F6;border-radius:12px;padding:20px;text-align:center;margin:20px 0}
      .otp-num{font-size:40px;font-weight:900;color:#1D4ED8;letter-spacing:10px}
      .ft{background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#aaa}
    </style></head>
    <body><div class="wrap">
      <div class="hdr">
        <h1>🎉 Booking Confirmed!</h1>
        <p>Your payment is secured in escrow — ${carName} is yours.</p>
      </div>
      <div class="bd">
        <p style="color:#333;font-size:15px">Hi <strong>${userName}</strong>, your booking is confirmed and payment is held securely in escrow.</p>

        <div class="box">
          <h3>📅 Booking Details</h3>
          <div class="row"><span class="lbl">Car</span><span class="val">${carName}</span></div>
          <div class="row"><span class="lbl">Pickup Date</span><span class="val">${pickupDate}</span></div>
          <div class="row"><span class="lbl">Return Date</span><span class="val">${returnDate}</span></div>
          <div class="row"><span class="lbl">Booking ID</span><span class="val" style="font-family:monospace">#${bookingId}</span></div>
          <div class="row"><span class="lbl">Amount Paid</span><span class="val" style="color:#16A34A">₹${Number(totalPrice).toLocaleString('en-IN')}</span></div>
        </div>

        <div class="otp-box">
          <p style="margin:0 0 8px;font-size:14px;color:#1E40AF;font-weight:600">🔑 Your Car Pickup OTP</p>
          <div class="otp-num">${pickupOtp}</div>
          <p style="margin:12px 0 0;font-size:13px;color:#3730A3">
            Show this OTP to the car owner at the time of pickup.<br/>
            The owner will enter it to confirm handover and receive their payment.
          </p>
          <p style="margin:8px 0 0;font-size:12px;color:#6366F1">⚠️ Do NOT share this OTP before you physically receive the car.</p>
        </div>

        <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:10px;padding:16px;margin:16px 0">
          <p style="margin:0;font-size:13px;color:#166534">
            💰 Your payment of <strong>₹${Number(totalPrice).toLocaleString('en-IN')}</strong> is held safely in escrow.
            It will only be released to the owner after you hand over the OTP, protecting you from fraud.
          </p>
        </div>
      </div>
      <div class="ft">© ${new Date().getFullYear()} CarRento. All rights reserved.</div>
    </div></body></html>`

    await transporter.sendMail({
      from: `"CarRento" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Booking Confirmed — ${carName} | OTP: ${pickupOtp}`,
      html
    })
    console.log(`✅ Booking confirmation email sent to ${toEmail}`)
  } catch (error) {
    console.log('❌ Error sending booking confirmation email:', error.message)
  }
}


// sendOwnerNotificationEmail  (sent to OWNER after payment)
// Now includes: pickup location, renter full details, bank/escrow note

export const sendOwnerNotificationEmail = async (ownerEmail, {
  ownerName, carName,
  renterName, renterEmail, renterPhone, renterLicence, renterAddress,
  pickupLocation, carLocation,
  pickupDate, returnDate, totalPrice, bookingId, pickupOtp
}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
    })

    const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <style>
      body{font-family:Arial,sans-serif;background:#f0f4f8;margin:0}
      .wrap{max-width:600px;margin:20px auto;background:#fff;border-radius:12px;
            overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
      .hdr{background:linear-gradient(135deg,#0558FE,#A9CFFF);color:#fff;padding:28px 32px}
      .hdr h1{margin:0;font-size:22px}
      .hdr p{margin:4px 0 0;opacity:.85;font-size:14px}
      .bd{padding:28px 32px}
      .box{background:#f8f9fa;border-radius:10px;padding:18px;margin:16px 0}
      .box h3{margin:0 0 12px;font-size:13px;color:#555;text-transform:uppercase;letter-spacing:.5px}
      .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:14px}
      .row:last-child{border:none}
      .lbl{color:#888}.val{font-weight:600;color:#222}
      .otp-box{background:#EFF6FF;border:2px solid #3B82F6;border-radius:12px;padding:20px;text-align:center;margin:20px 0}
      .otp-num{font-size:40px;font-weight:900;color:#1D4ED8;letter-spacing:10px}
      .escrow-box{background:#F0FDF4;border:1px solid #86EFAC;border-radius:10px;padding:16px;margin:16px 0}
      .location-box{background:#FFF7ED;border:1px solid #FDBA74;border-radius:10px;padding:16px;margin:16px 0}
      .ft{background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#aaa}
    </style></head>
    <body><div class="wrap">
      <div class="hdr">
        <h1>🚗 New Booking — ${carName}</h1>
        <p>Payment secured in escrow • Ready for handover</p>
      </div>
      <div class="bd">
        <p style="color:#333;font-size:15px">Hi <strong>${ownerName}</strong>, great news! A booking has been confirmed and the payment is safely held in escrow.</p>

        <!-- Renter Details -->
        <div class="box">
          <h3>👤 Renter Details</h3>
          <div class="row"><span class="lbl">Full Name</span><span class="val">${renterName}</span></div>
          <div class="row"><span class="lbl">Email</span><span class="val">${renterEmail}</span></div>
          <div class="row"><span class="lbl">Phone</span><span class="val">${renterPhone || 'Not provided'}</span></div>
          <div class="row"><span class="lbl">Driving Licence</span><span class="val">${renterLicence || 'Not provided'}</span></div>
        </div>

        <!-- Pickup Location -->
        <div class="location-box">
          <h3 style="margin:0 0 8px;color:#EA580C;font-size:15px">📍 Car Pickup Location</h3>
          <p style="margin:0;font-size:15px;font-weight:700;color:#7C2D12">
            ${pickupLocation || carLocation || 'Not specified by renter'}
          </p>
          <p style="margin:8px 0 0;font-size:12px;color:#9A3412">
            Please be at this location on the pickup date with your car keys. Confirm the renter's identity by asking for the OTP below.
          </p>
        </div>

        <!-- Booking Details -->
        <div class="box">
          <h3>📅 Booking Details</h3>
          <div class="row"><span class="lbl">Car</span><span class="val">${carName}</span></div>
          <div class="row"><span class="lbl">Pickup Date</span><span class="val">${pickupDate}</span></div>
          <div class="row"><span class="lbl">Return Date</span><span class="val">${returnDate}</span></div>
          <div class="row"><span class="lbl">Booking ID</span><span class="val" style="font-family:monospace">#${bookingId}</span></div>
          <div class="row"><span class="lbl">Total Amount</span><span class="val" style="color:#16A34A">₹${Number(totalPrice).toLocaleString('en-IN')}</span></div>
        </div>

        <!-- Escrow Info -->
        <div class="escrow-box">
          <h3 style="margin:0 0 8px;color:#16A34A;font-size:15px">💰 Your Payment — In Escrow</h3>
          <p style="margin:0;font-size:14px;color:#166534">
            <strong>₹${Number(totalPrice).toLocaleString('en-IN')}</strong> is securely held by CarRento.
          </p>
          <p style="margin:8px 0 0;font-size:13px;color:#166534">
            Once you enter the OTP in your <strong>Manage Bookings</strong> dashboard at handover,
            this amount will be <strong>released to your bank account within 2-3 business days</strong>.
          </p>
        </div>
      </div>
      <div class="ft">© ${new Date().getFullYear()} CarRento. All rights reserved.</div>
    </div></body></html>`

    await transporter.sendMail({
      from: `"CarRento" <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      subject: `🚗 New Booking: ${carName} — ₹${Number(totalPrice).toLocaleString('en-IN')} in Escrow`,
      html
    })
    console.log(`✅ Owner notification email sent to ${ownerEmail}`)
  } catch (error) {
    console.log('❌ Error sending owner notification email:', error.message)
  }
}


// sendBookingCancellationEmail  (sent to RENTER on cancel)

export const sendBookingCancellationEmail = async (toEmail, {
  userName, carName, pickupDate, returnDate, totalPrice, bookingId
}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
    })

    const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <style>
      body{font-family:Arial,sans-serif;background:#f0f4f8;margin:0}
      .wrap{max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden}
      .hdr{background:#EF4444;color:#fff;padding:28px 32px}
      .hdr h1{margin:0;font-size:22px}
      .bd{padding:28px 32px}
      .box{background:#f8f9fa;border-radius:10px;padding:18px;margin:16px 0}
      .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:14px}
      .row:last-child{border:none}
      .lbl{color:#888}.val{font-weight:600;color:#222}
      .ft{background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#aaa}
    </style></head>
    <body><div class="wrap">
      <div class="hdr"><h1>🚫 Booking Cancelled</h1></div>
      <div class="bd">
        <p style="font-size:15px;color:#333">Hi <strong>${userName}</strong>, your booking has been cancelled.</p>
        <div class="box">
          <div class="row"><span class="lbl">Car</span><span class="val">${carName}</span></div>
          <div class="row"><span class="lbl">Pickup Date</span><span class="val">${pickupDate}</span></div>
          <div class="row"><span class="lbl">Return Date</span><span class="val">${returnDate}</span></div>
          <div class="row"><span class="lbl">Booking ID</span><span class="val" style="font-family:monospace">#${bookingId}</span></div>
          <div class="row"><span class="lbl">Amount</span><span class="val">₹${Number(totalPrice).toLocaleString('en-IN')}</span></div>
        </div>
        <p style="font-size:13px;color:#555">If you paid online, your refund will be processed within 5-7 business days. Contact support if you have questions.</p>
      </div>
      <div class="ft">© ${new Date().getFullYear()} CarRento. All rights reserved.</div>
    </div></body></html>`

    await transporter.sendMail({
      from: `"CarRento" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Booking Cancelled — ${carName} | #${bookingId}`,
      html
    })
    console.log(`✅ Cancellation email sent to ${toEmail}`)
  } catch (error) {
    console.log('❌ Error sending cancellation email:', error.message)
  }
}


// sendStatusChangeEmail  (sent to RENTER when owner changes booking status)

export const sendStatusChangeEmail = async (toEmail, {
  userName, carName, pickupDate, returnDate, totalPrice, bookingId, status
}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
    })

    const cfg = {
      confirmed:  { color: '#16A34A', badge: 'Confirmed', message: 'Your booking has been confirmed by the owner.' },
      cancelled:  { color: '#DC2626', badge: 'Cancelled',  message: 'Your booking has been cancelled.' },
      pending:    { color: '#D97706', badge: 'Pending',    message: 'Your booking status has been updated to pending.' },
    }[status] || { color: '#555', badge: status, message: `Your booking status changed to ${status}.` }

    const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <style>
      body{font-family:Arial,sans-serif;background:#f0f4f8;margin:0}
      .wrap{max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden}
      .hdr{background:linear-gradient(135deg,#0558FE,#A9CFFF);color:#fff;padding:28px 32px}
      .bd{padding:28px 32px}
      .box{background:#f8f9fa;border-radius:10px;padding:18px;margin:16px 0}
      .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:14px}
      .row:last-child{border:none}
      .lbl{color:#888}.val{font-weight:600;color:#222}
      .ft{background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#aaa}
    </style></head>
    <body><div class="wrap">
      <div class="hdr"><h1>Booking Status Updated</h1></div>
      <div class="bd">
        <p style="font-size:15px;color:#333">Hi <strong>${userName}</strong>, ${cfg.message}</p>
        <p style="font-size:20px;font-weight:700;color:${cfg.color}">${cfg.badge}</p>
        <div class="box">
          <div class="row"><span class="lbl">Car</span><span class="val">${carName}</span></div>
          <div class="row"><span class="lbl">Pickup Date</span><span class="val">${pickupDate}</span></div>
          <div class="row"><span class="lbl">Return Date</span><span class="val">${returnDate}</span></div>
          <div class="row"><span class="lbl">Booking ID</span><span class="val" style="font-family:monospace">#${bookingId}</span></div>
          <div class="row"><span class="lbl">Amount</span><span class="val">₹${Number(totalPrice).toLocaleString('en-IN')}</span></div>
        </div>
      </div>
      <div class="ft">© ${new Date().getFullYear()} CarRento. All rights reserved.</div>
    </div></body></html>`

    await transporter.sendMail({
      from: `"CarRento" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Booking ${cfg.badge} — ${carName} | #${bookingId}`,
      html
    })
    console.log(`Status change email (${status}) sent to ${toEmail}`)
  } catch (error) {
    console.log('Error sending status change email:', error.message)
  }
}

export const sendPasswordResetEmail = async (toEmail, { userName, otp }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
    })

    const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <style>
      body{font-family:Arial,sans-serif;background:#f0f4f8;margin:0}
      .wrap{max-width:600px;margin:20px auto;background:#fff;border-radius:12px;
            overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
      .hdr{background:linear-gradient(135deg,#0558FE,#A9CFFF);color:#fff;padding:28px 32px}
      .hdr h1{margin:0;font-size:22px}
      .hdr p{margin:4px 0 0;opacity:.85;font-size:14px}
      .bd{padding:28px 32px}
      .otp-box{background:#EFF6FF;border:2px solid #3B82F6;border-radius:12px;
               padding:24px;text-align:center;margin:24px 0}
      .otp-num{font-size:44px;font-weight:900;color:#1D4ED8;letter-spacing:12px;
               font-family:monospace}
      .warning{background:#FFF7ED;border:1px solid #FDBA74;border-radius:10px;
               padding:14px 18px;margin:16px 0;font-size:13px;color:#92400E}
      .ft{background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#aaa}
    </style></head>
    <body><div class="wrap">
      <div class="hdr">
        <h1>🔐 Password Reset Request</h1>
        <p>Use the OTP below to reset your CarRento password</p>
      </div>
      <div class="bd">
        <p style="color:#333;font-size:15px">Hi <strong>${userName}</strong>,</p>
        <p style="color:#555;font-size:14px;margin-top:4px">
          We received a request to reset your password. Use this OTP to proceed:
        </p>

        <div class="otp-box">
          <p style="margin:0 0 10px;font-size:13px;color:#1E40AF;font-weight:600">
            Your Password Reset OTP
          </p>
          <div class="otp-num">${otp}</div>
          <p style="margin:12px 0 0;font-size:13px;color:#3730A3">
            This OTP is valid for <strong>10 minutes</strong> only.
          </p>
        </div>

        <div class="warning">
          ⚠️ <strong>Did not request this?</strong> If you didn't request a password reset,
          ignore this email. Your account is safe.
        </div>

        <p style="font-size:12px;color:#aaa;margin-top:16px">
          For security, never share this OTP with anyone. CarRento staff will never ask for it.
        </p>
      </div>
      <div class="ft">© ${new Date().getFullYear()} CarRento. All rights reserved.</div>
    </div></body></html>`

    await transporter.sendMail({
      from: `"CarRento" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `🔐 Password Reset OTP: ${otp} — CarRento`,
      html
    })
    console.log(`✅ Password reset OTP email sent to ${toEmail}`)
  } catch (error) {
    console.log('❌ Error sending password reset email:', error.message)
  }
}

// sendBookingRefundEmail  (sent to RENTER when booking is cancelled & refund initiated)

export const sendBookingRefundEmail = async (toEmail, {
  userName, carName, pickupDate, returnDate, totalPrice, bookingId, refundId
}) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD }
    })

    const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <style>
      body{font-family:Arial,sans-serif;background:#f0f4f8;margin:0}
      .wrap{max-width:600px;margin:20px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)}
      .hdr{background:linear-gradient(135deg,#F59E0B,#FCD34D);color:#fff;padding:28px 32px}
      .hdr h1{margin:0;font-size:22px}
      .bd{padding:28px 32px}
      .box{background:#f8f9fa;border-radius:10px;padding:18px;margin:16px 0}
      .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:14px}
      .row:last-child{border:none}
      .lbl{color:#888}.val{font-weight:600;color:#222}
      .refund-box{background:#FEF3C7;border:2px solid #F59E0B;border-radius:12px;padding:20px;margin:16px 0}
      .refund-box h3{margin:0 0 12px;color:#D97706;font-size:15px}
      .refund-amount{font-size:32px;font-weight:900;color:#EA580C;margin:8px 0}
      .refund-id{background:#fff;padding:12px;border-radius:8px;margin:12px 0;font-family:monospace;font-size:12px;color:#666;word-break:break-all}
      .timeline{background:#F0FDF4;border:1px solid #86EFAC;border-radius:10px;padding:16px;margin:16px 0}
      .ft{background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#aaa}
    </style></head>
    <body><div class="wrap">
      <div class="hdr">
        <h1>💰 Refund Initiated</h1>
        <p>Your booking has been cancelled and a refund has been initiated</p>
      </div>
      <div class="bd">
        <p style="color:#333;font-size:15px">Hi <strong>${userName}</strong>,</p>
        <p style="color:#555;font-size:14px">Your booking has been cancelled successfully. A refund of <strong>₹${Number(totalPrice).toLocaleString('en-IN')}</strong> has been initiated to your account.</p>

        <!-- Booking Details -->
        <div class="box">
          <h3 style="margin:0 0 12px;font-size:13px;color:#555;text-transform:uppercase;letter-spacing:.5px">📅 Booking Details</h3>
          <div class="row"><span class="lbl">Car</span><span class="val">${carName}</span></div>
          <div class="row"><span class="lbl">Pickup Date</span><span class="val">${pickupDate}</span></div>
          <div class="row"><span class="lbl">Return Date</span><span class="val">${returnDate}</span></div>
          <div class="row"><span class="lbl">Booking ID</span><span class="val" style="font-family:monospace">#${bookingId}</span></div>
          <div class="row"><span class="lbl">Amount Refunded</span><span class="val" style="color:#EA580C">₹${Number(totalPrice).toLocaleString('en-IN')}</span></div>
        </div>

        <!-- Refund Details -->
        <div class="refund-box">
          <h3>✅ Refund Status</h3>
          <p style="margin:0 0 8px;font-size:13px;color:#D97706">Your refund has been successfully initiated.</p>
          <div class="refund-amount">₹${Number(totalPrice).toLocaleString('en-IN')}</div>
          <p style="margin:0;font-size:12px;color:#92400E">Refund ID:</p>
          <div class="refund-id">${refundId}</div>
        </div>

        <!-- Timeline -->
        <div class="timeline">
          <h3 style="margin:0 0 12px;color:#166534;font-size:15px">⏱️ Timeline</h3>
          <div style="font-size:13px;color:#166534;line-height:1.8">
            <p style="margin:0"><strong>✓ Refund Initiated:</strong> Today, ${new Date().toDateString()}</p>
            <p style="margin:8px 0 0"><strong>⏳ Processing Time:</strong> 5-7 business days</p>
            <p style="margin:8px 0 0"><strong>💳 Refund to:</strong> Your original payment method</p>
          </div>
        </div>

        <p style="font-size:13px;color:#555;margin-top:16px">
          The refund will be transferred to the bank account or payment method you used to complete the booking. 
          If you don't see the refund within 7 business days, please <strong>contact our support team</strong> with your Refund ID: <strong>${refundId}</strong>
        </p>
      </div>
      <div class="ft">© ${new Date().getFullYear()} CarRento. All rights reserved.</div>
    </div></body></html>`

    await transporter.sendMail({
      from: `"CarRento" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `💰 Refund Initiated — ₹${Number(totalPrice).toLocaleString('en-IN')} | #${bookingId}`,
      html
    })
    console.log(`✅ Refund email sent to ${toEmail}`)
  } catch (error) {
    console.log('❌ Error sending refund email:', error.message)
  }
}