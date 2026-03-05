import React, { useEffect, useState } from 'react'
import Title from '../components/Title';
import { motion } from 'motion/react'
import { assets } from '../assets/assets';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast'

const MyBookings = () => {
  const { axios, user, currency } = useAppContext();
  const [bookings, setBookings]     = useState([])
  const [disputing, setDisputing]   = useState(null)

  const fetchMyBooking = async () => {
    try {
      const { data } = await axios.get('/api/bookings/user')
      if (data.success) setBookings(data.bookings)
      else toast.error(data.message)
    } catch (error) {
      toast.error(error.message)
    }
  }

  // ── Cancel booking (with auto-refund if paid) ─────────────────────────────
  const cancelBooking = async (bookingId, isPaid) => {
    const msg = isPaid
      ? 'Cancel this booking? Since you already paid, a refund will be initiated (5-7 business days).'
      : 'Are you sure you want to cancel this booking?'

    if (!window.confirm(msg)) return

    try {
      const { data } = await axios.post('/api/bookings/cancel', { bookingId })
      if (data.success) {
        toast.success(data.message, { duration: 6000 })
        fetchMyBooking()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // ── Raise dispute — owner didn't show up ─────────────────────────────────
  const raiseDispute = async (bookingId) => {
    if (!window.confirm(
      'Report that the owner did not show up? Your payment will be refunded within 5-7 business days.'
    )) return

    setDisputing(bookingId)
    try {
      const { data } = await axios.post('/api/bookings/raise-dispute', {
        bookingId,
        reason: 'Owner did not show up at pickup location',
      })
      if (data.success) {
        toast.success(data.message, { duration: 8000 })
        fetchMyBooking()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setDisputing(null)
  }

  // ── Can raise dispute: confirmed + paid + past pickup date + not handed over ─
  const canRaiseDispute = (booking) =>
    booking.status === 'confirmed' &&
    booking.paymentStatus === 'paid' &&
    new Date(booking.pickupDate) < new Date() &&
    !booking.otpVerified &&
    !booking.hasDispute

  useEffect(() => { preloadRazorpay() }, [])

  const preloadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true)
      const s = document.createElement('script')
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      s.onload  = () => resolve(true)
      s.onerror = () => resolve(false)
      document.head.appendChild(s)
    })

  const bookingRazorpay = async (bookingId) => {
    try {
      const { data } = await axios.post('/api/user/payment-razorpay', { bookingId })
      if (!data.success) return toast.error(data.message)

      const loaded = await preloadRazorpay()
      if (!loaded) return toast.error('Razorpay SDK failed to load. Check your connection.')

      const options = {
        key:         data.key,
        amount:      data.order.amount,
        currency:    data.order.currency,
        name:        'CarRento',
        description: 'Car Booking Payment',
        order_id:    data.order.id,

        handler: async (response) => {
          try {
            const { data: verifyData } = await axios.post('/api/user/verify-payment', {
              bookingId,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            })
            if (verifyData.success) {
              toast.success('Payment Successful! 🔒 Money held in escrow until car handover.')
              fetchMyBooking()
            } else {
              toast.error(verifyData.message || 'Payment verification failed. Contact support.')
            }
          } catch (err) {
            toast.error('Verification error: ' + err.message)
          }
        },

        theme: { color: '#0558FE' },
        modal: { ondismiss: () => toast.error('Payment cancelled.') },
      }

      new window.Razorpay(options).open()
    } catch (error) {
      toast.error('Payment error: ' + error.message)
    }
  }

  useEffect(() => { user && fetchMyBooking() }, [user])

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className='mt-16 items-start px-6 md:px-16 lg:px-24 xl:px-32 max-w-7xl text-sm'
    >
      <Title title="My Bookings" subTitle="View and manage all your car bookings" align="left" />

      <div>
        {bookings.map((booking, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            key={booking._id}
            className='grid grid-cols-1 md:grid-cols-4 gap-6 p-6 mt-5 first:mt-12
              border border-borderColor rounded-lg'
          >
            {/* ── Car image + info ──────────────────────────────────────── */}
            <div className='col-span-1'>
              <div className='rounded-md overflow-hidden mb-3'>
                <img
                  src={booking.car?.images?.[0]}
                  alt=''
                  className='w-full h-auto aspect-video object-cover'
                />
              </div>
              <p className='text-lg font-medium mt-2'>{booking.car.brand}</p>
              <p className='text-gray-500'>
                {booking.car.year} • {booking.car.category} • {booking.car.location}
              </p>
            </div>

            {/* ── Booking details ────────────────────────────────────────── */}
            <div className='md:col-span-2'>
              <div className='flex items-center gap-2 flex-wrap'>
                <p className='px-3 py-1.5 bg-light rounded'>Booking #{index + 1}</p>
                <p className={`px-3 py-1 text-xs rounded-full capitalize font-medium
                  ${booking.status === 'confirmed'  ? 'bg-green-100 text-green-600'
                  : booking.status === 'cancelled'  ? 'bg-red-100 text-red-500'
                  : booking.status === 'completed'  ? 'bg-blue-100 text-blue-600'
                  : 'bg-yellow-100 text-yellow-600'}`}>
                  {booking.status}
                </p>
                {/* Refunded badge */}
                {booking.paymentStatus === 'refunded' && (
                  <p className='px-3 py-1 text-xs rounded-full font-medium bg-orange-100 text-orange-600'>
                    💸 Refund Initiated
                  </p>
                )}
              </div>

              <div className='mt-4 space-y-2 text-gray-500'>
                <div className='flex items-center gap-2'>
                  <img src={assets.calendar_icon_colored} alt='' className='h-4' />
                  <span><strong>Pickup:</strong> {new Date(booking.pickupDate).toDateString()}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <img src={assets.calendar_icon_colored} alt='' className='h-4' />
                  <span><strong>Return:</strong> {new Date(booking.returnDate).toDateString()}</span>
                </div>
                {booking.pickupLocation && (
                  <div className='flex items-center gap-2'>
                    <img src={assets.location_icon_colored} alt='' className='h-4' />
                    <span><strong>Pickup Location:</strong> {booking.pickupLocation}</span>
                  </div>
                )}
                <p>
                  <strong>Total:</strong>{' '}
                  <span className='text-primary font-semibold'>
                    {currency}{booking.price.toLocaleString('en-IN')}
                  </span>
                </p>
                <p>
                  <strong>Payment:</strong>{' '}
                  <span className={
                    booking.paymentStatus === 'paid'     ? 'text-green-600'
                    : booking.paymentStatus === 'refunded' ? 'text-orange-500'
                    : 'text-gray-400'
                  }>
                    {booking.paymentStatus === 'paid'     ? '✅ Paid (Escrow)'
                    : booking.paymentStatus === 'refunded' ? '💸 Refund Initiated (5-7 days)'
                    : 'Not paid'}
                  </span>
                </p>
                <p className='text-xs text-gray-400'>
                  Booked on {new Date(booking.createdAt).toDateString()}
                </p>

                {/* Dispute raised info */}
                {booking.hasDispute && (
                  <div className='mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700'>
                    ⚠️ Dispute raised — refund is being processed (5-7 business days)
                  </div>
                )}
              </div>
            </div>

            {/* ── Action buttons ────────────────────────────────────────── */}
            <div className='md:col-span-1 flex flex-col gap-2 justify-start md:pt-2'>

              {/* Pay Now */}
              {booking.status !== 'cancelled' &&
               booking.status !== 'completed' &&
               booking.paymentStatus !== 'paid' &&
               booking.paymentStatus !== 'refunded' && (
                <button
                  onClick={() => bookingRazorpay(booking._id)}
                  className='w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium
                    hover:bg-blue-700 transition-all'
                >
                  Pay Now
                </button>
              )}

              {/* OTP display — after payment, before handover */}
              {booking.paymentStatus === 'paid' &&
               !booking.otpVerified &&
               booking.status !== 'cancelled' && (
                <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                  <p className='text-xs text-blue-600 font-medium mb-1'>🔑 Your Pickup OTP</p>
                  <p className='text-2xl font-mono font-bold text-blue-800 tracking-[0.3em]'>
                    {booking.pickupOtp || '——'}
                  </p>
                  <p className='text-xs text-blue-500 mt-1'>Show this to the owner at car pickup</p>
                </div>
              )}

              {/* Cancel — not paid, not cancelled, not completed */}
              {(booking.status === 'pending' || booking.status === 'confirmed') &&
               booking.paymentStatus !== 'paid' &&
               booking.paymentStatus !== 'refunded' && (
                <button
                  onClick={() => cancelBooking(booking._id, false)}
                  className='w-full px-4 py-2 border border-red-300 text-red-500 rounded-lg text-sm
                    font-medium hover:bg-red-50 transition-all'
                >
                  Cancel Booking
                </button>
              )}

              {/* Cancel & Refund — PAID but OTP not verified yet */}
              {(booking.status === 'pending' || booking.status === 'confirmed') &&
               booking.paymentStatus === 'paid' &&
               !booking.otpVerified &&
               !booking.hasDispute && (
                <button
                  onClick={() => cancelBooking(booking._id, true)}
                  className='w-full px-4 py-2 border border-orange-300 text-orange-600 rounded-lg
                    text-sm font-medium hover:bg-orange-50 transition-all'
                >
                  Cancel & Get Refund
                </button>
              )}

              {/* ── Raise Dispute — owner didn't show up ─────────────────── */}
              {canRaiseDispute(booking) && (
                <button
                  onClick={() => raiseDispute(booking._id)}
                  disabled={disputing === booking._id}
                  className='w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg
                    text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed'
                >
                  {disputing === booking._id
                    ? <span className='flex items-center justify-center gap-1.5'>
                        <span className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' />
                        Processing...
                      </span>
                    : 'Owner Didn\'t Show Up'}
                </button>
              )}

              {/* Car Handed Over badge */}
              {booking.otpVerified && (
                <div className='px-4 py-2 bg-green-50 border border-green-200 text-green-700
                  rounded-lg text-xs text-center font-medium'>
                  Car Handed Over
                </div>
              )}

              {/* Cancelled badge */}
              {booking.status === 'cancelled' && !booking.hasDispute && (
                <div className='px-4 py-2 bg-red-50 border border-red-200 text-red-500
                  rounded-lg text-xs text-center font-medium'>
                  Booking Cancelled
                  {booking.paymentStatus === 'refunded' && (
                    <p className='text-orange-500 mt-1'>Refund in 5-7 days</p>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default MyBookings