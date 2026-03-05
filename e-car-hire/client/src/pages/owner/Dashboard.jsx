import React, { useEffect, useState } from 'react'
import Title from '../../components/owner/Title'
import { assets } from '../../assets/assets'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { currency, axios } = useAppContext()
  const [data, setData] = useState(null)

  const fetchDashboard = async () => {
    try {
      const { data: res } = await axios.get('/api/owner/dashboard')
      if (res.success) {
        setData(res.dashboardData)
      } else {
        toast.error(res.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  if (!data) {
    return (
      <div className='flex-1 flex items-center justify-center py-20'>
        <div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  const statCards = [
    { title: 'Total Cars', value: data.totalCars, icon: assets.carIconColored },
    { title: 'Total Bookings', value: data.totalBookings, icon: assets.listIconColored },
    { title: 'Pending Bookings', value: data.pendingBookings, icon: assets.cautionIconColored },
    { title: 'Completed Trips', value: data.completedBookings, icon: assets.check_icon },
  ]

  return (
    <div className='px-4 pt-10 md:px-10 flex-1'>
      <Title
        title='Dashboard'
        subTitle="An overview of your cars, bookings, and earnings."
      />

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8'>
        {statCards.map((card, i) => (
          <div key={i} className='flex items-center justify-between p-4 rounded-md border border-borderColor'>
            <div>
              <h1 className='text-xs text-gray-500'>{card.title}</h1>
              <p className='text-lg font-semibold'>{card.value || 0}</p>
            </div>
            <div className='flex items-center justify-center w-10 h-10 rounded-full bg-primary/10'>
              <img src={card.icon} alt='Icon' className='h-4 w-4' />
            </div>
          </div>
        ))}
      </div>

      {/* ── Balance cards ───────────────────────────────────────────────── */}
      <div className='flex flex-wrap gap-4 mt-6 mb-2'>

        {/* Available Balance (released from escrow after OTP) */}
        <div className='flex-1 min-w-[200px] p-5 border border-green-200 rounded-xl bg-green-50'>
          <p className='text-xs text-green-600 uppercase font-medium tracking-wide'>
            💰 Available Balance
          </p>
          <p className='text-3xl font-bold text-green-700 mt-1'>
            {currency}{(data.availableBalance || 0).toLocaleString('en-IN')}
          </p>
          <p className='text-xs text-green-500 mt-1'>Released after OTP verification</p>
        </div>

        {/* In Escrow (paid, OTP not yet verified) */}
        <div className='flex-1 min-w-[200px] p-5 border border-blue-200 rounded-xl bg-blue-50'>
          <p className='text-xs text-blue-600 uppercase font-medium tracking-wide'>
            🔒 In Escrow
          </p>
          <p className='text-3xl font-bold text-blue-700 mt-1'>
            {currency}{(data.pendingBalance || data.escrowBalance || 0).toLocaleString('en-IN')}
          </p>
          <p className='text-xs text-blue-500 mt-1'>Held until OTP verified at handover</p>
        </div>

        {/* Total Earnings all time */}
        <div className='flex-1 min-w-[200px] p-5 border border-purple-200 rounded-xl bg-purple-50'>
          <p className='text-xs text-purple-600 uppercase font-medium tracking-wide'>
            📈 Total Earnings
          </p>
          <p className='text-3xl font-bold text-purple-700 mt-1'>
            {currency}{(data.totalEarnings || 0).toLocaleString('en-IN')}
          </p>
          <p className='text-xs text-purple-500 mt-1'>All-time released payments</p>
        </div>

      </div>

      {/* ── Recent Bookings + Monthly Revenue ──────────────────────────── */}
      <div className='flex flex-wrap gap-6 mb-8 w-full mt-6'>

        {/* Recent Bookings */}
        <div className='p-4 md:p-6 border border-borderColor rounded-md max-w-lg w-full'>
          <h1 className='text-lg font-medium'>Recent Bookings</h1>
          <p className='text-gray-500 text-sm'>Latest customer bookings</p>

          {(data.recentBookings || []).map((booking, index) => (
            <div key={index} className='mt-4 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-primary/10'>
                  <img src={assets.listIconColored} alt='' className='h-5 w-5' />
                </div>
                <div>
                  <p className='font-medium text-sm'>{booking.car?.brand} {booking.car?.model}</p>
                  <p className='text-xs text-gray-500'>
                    {booking.createdAt?.split('T')[0]}
                  </p>
                  {booking.user?.name && (
                    <p className='text-xs text-gray-400'><img src={assets.userIcon} className='inline w-3 h-3 mr-1' /> {booking.user.name}</p>
                  )}
                </div>
              </div>
              <div className='flex flex-col items-end gap-1'>
                <p className='text-sm font-medium'>
                  {currency}{(booking.price || 0).toLocaleString('en-IN')}
                </p>
                {/* Show escrow status */}
                <span className={`text-xs px-2 py-0.5 rounded-full
                  ${booking.otpVerified
                    ? 'bg-green-100 text-green-600'
                    : booking.paymentStatus === 'paid'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                  {booking.otpVerified
                    ? 'Released'
                    : booking.paymentStatus === 'paid'
                      ? 'In Escrow'
                      : 'Unpaid'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Revenue */}
        <div className='p-4 md:p-6 mb-6 rounded-md w-full border border-borderColor md:max-w-xs'>
          <h1 className='text-lg font-medium'>This Month</h1>
          <p className='text-gray-500 text-sm'>Completed trips revenue</p>
          <p className='text-3xl text-primary font-semibold mt-6'>
            {currency} {(data.monthlyRevenue || 0).toLocaleString('en-IN')}
          </p>

          <div className='mt-6 p-3 bg-green-50 rounded-lg'>
            <p className='text-xs text-green-700'>
              ✅ This is money already released to you this month after OTP verification.
              Check <strong>In Escrow</strong> above for funds pending release.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard