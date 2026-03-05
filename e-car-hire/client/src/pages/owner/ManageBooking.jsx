import React, { useEffect, useState } from 'react'
import Title from '../../components/owner/Title'
import { useAppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets';
import toast from 'react-hot-toast'

const ManageBooking = () => {
  const { currency, axios } = useAppContext()
  const [bookings, setBookings] = useState([])
  const [otpInput, setOtpInput] = useState({})
  const [verifying, setVerifying] = useState(null)

  const fetchOwnerBookings = async () => {
    try {
      const { data } = await axios.get('/api/bookings/owner')
      if (data.success) {
        setBookings(data.bookings)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const changeBookingStatus = async (bookingId, status) => {
    try {
      const { data } = await axios.post('/api/bookings/change-status', { bookingId, status })
      if (data.success) {
        toast.success(data.message)
        fetchOwnerBookings()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleOtpVerify = async (bookingId) => {
    if (!otpInput[bookingId] || otpInput[bookingId].length !== 6) {
      return toast.error('Please enter the 6-digit OTP')
    }
    setVerifying(bookingId)
    try {
      // ✅ FIXED: was /api/owner/verify-otp — now matches bookingRouter
      const { data } = await axios.post('/api/bookings/verify-otp', {
        bookingId,
        otp: otpInput[bookingId],
      })
      if (data.success) {
        toast.success(data.message)
        setOtpInput(prev => {
          const next = { ...prev }
          delete next[bookingId]
          return next
        })
        fetchOwnerBookings()
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
    setVerifying(null)
  }

  useEffect(() => {
    fetchOwnerBookings()
  }, [])

  return (
    <div className='px-4 pt-10 md:px-10 flex-1'>
      <Title
        title="Manage Bookings"
        subTitle="Track all customer bookings, approve or cancel requests, and manage booking statuses."
      />

      <div className='max-w-3xl w-full rounded-md overflow-hidden border border-borderColor mt-6'>
        {bookings.length === 0 ? (
          <div className='py-16 text-center text-gray-400 text-sm'>
            No bookings yet
          </div>
        ) : (
          <table className='w-full border-collapse text-left text-sm text-gray-600'>
            <thead className='text-gray-500'>
              <tr>
                <th className='p-3 font-medium'>Car</th>
                <th className='p-3 font-medium max-md:hidden'>Date Range</th>
                <th className='p-3 font-medium'>Total</th>
                <th className='p-3 font-medium max-md:hidden'>Payment</th>
                <th className='p-3 font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <React.Fragment key={booking._id}>

                  {/* ── Main booking row ── */}
                  <tr className='border-t border-borderColor text-gray-500'>
                    <td className='p-3 flex items-center gap-3'>
                      <img
                        src={booking.car?.images?.[0] || '/placeholder.png'}
                        className='h-12 w-12 aspect-square rounded-md object-cover'
                        alt={`${booking.car?.brand} ${booking.car?.model}`}
                        onError={e => { e.target.src = '/placeholder.png' }}
                      />
                      <div>
                        <p className='font-medium max-md:hidden'>
                          {booking.car?.brand} {booking.car?.model}
                        </p>
                        {booking.user?.name && (
                          <p className='text-xs text-gray-400 max-md:hidden'>
                            <img src={assets.userIcon} className='inline w-3 h-3 mr-1' />
                            {booking.user.name}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className='p-3 max-md:hidden'>
                      {booking.pickupDate?.split('T')[0]} to {booking.returnDate?.split('T')[0]}
                    </td>

                    <td className='p-3'>
                      {currency}{booking.price?.toLocaleString('en-IN')}
                    </td>

                    <td className='p-3 max-md:hidden'>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${booking.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                        }`}>
                        {booking.paymentStatus === 'paid' ? '✅ Paid' : 'Unpaid'}
                      </span>
                    </td>

                    <td className='p-3'>
                      <div className='flex items-center justify-start'>
                        {booking.status === 'pending' ? (
                          <select
                            onChange={e => changeBookingStatus(booking._id, e.target.value)}
                            value={booking.status}
                            className='px-2 py-1.5 text-gray-500 border border-gray-300 rounded-md outline-none text-sm'
                          >
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="confirmed">Confirmed</option>
                          </select>
                        ) : (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${booking.status === 'confirmed' || booking.status === 'active'
                              ? 'bg-green-100 text-green-600'
                              : booking.status === 'completed'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-red-100 text-red-500'
                            }`}>
                            {booking.status}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* ── OTP Row — shown for confirmed/active + paid bookings ── */}
                  {(booking.status === 'confirmed' || booking.status === 'active') &&
                    booking.paymentStatus === 'paid' && (
                      <tr className='border-t border-borderColor bg-blue-50/40'>
                        <td colSpan={5} className='px-4 py-3'>
                          {booking.otpVerified ? (
                            <div className='flex flex-wrap items-center gap-3'>
                              <p className='text-xs text-green-700 font-medium bg-green-50 border border-green-200 px-3 py-2 rounded-lg inline-flex items-center gap-1.5'>
                                ✅ OTP Verified — Car handed over to renter
                              </p>
                              <p className='text-xs text-blue-700 font-medium bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg inline-flex items-center gap-1.5'>
                                💰 {currency}{booking.price?.toLocaleString('en-IN')} released to your account
                              </p>
                            </div>
                          ) : (
                            <div className='flex flex-col gap-2'>
                              <p className='text-xs font-semibold text-blue-800'>
                                🔑 Ask the renter for their 6-digit OTP to hand over the car:
                              </p>
                              <div className='flex gap-2 items-center flex-wrap'>
                                <input
                                  type='text'
                                  maxLength={6}
                                  placeholder='Enter 6-digit OTP'
                                  value={otpInput[booking._id] || ''}
                                  onChange={e => setOtpInput(prev => ({
                                    ...prev,
                                    [booking._id]: e.target.value.replace(/\D/g, '')
                                  }))}
                                  className='w-40 px-3 py-1.5 border-2 border-blue-300 rounded-lg text-sm focus:outline-none focus:border-primary tracking-widest font-mono bg-white'
                                />
                                <button
                                  onClick={() => handleOtpVerify(booking._id)}
                                  disabled={verifying === booking._id}
                                  className='px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5'
                                >
                                  {verifying === booking._id
                                    ? <><div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin' />Verifying...</>
                                    : '✅ Verify OTP & Release Payment'}
                                </button>
                                <p className='text-xs text-gray-400'>
                                  💡 {currency}{booking.price?.toLocaleString('en-IN')} will be credited after verification
                                </p>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}

                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default ManageBooking