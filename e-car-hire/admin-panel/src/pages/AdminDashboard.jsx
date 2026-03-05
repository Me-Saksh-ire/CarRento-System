// admin/src/pages/AdminDashboard.jsx
import { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../context/AdminContext'
import toast from 'react-hot-toast'
import { adminAssets } from '../assets/assets' 

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shrink-0`} style={{ backgroundColor: color }}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  </div>
)

// ─── Status badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    confirmed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

const AdminDashboard = () => {
  const { api } = useContext(AdminContext)
  const [stats, setStats] = useState(null)
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/api/admin/dashboard')
      if (data.success) {
        setStats(data.stats)
        setRecentBookings(data.recentBookings)
      } else {
        toast.error(data.message)
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  const statCards = stats ? [
  { label: 'Total Users',            value: stats.totalUsers,                 icon: <img src={adminAssets.users} className="w-6 h-6" /> },
  { label: 'Total Owners',           value: stats.totalOwners,                icon: <img src={adminAssets.userIconColored} className="w-6 h-6" /> },
  { label: 'Total Cars',             value: stats.totalCars,                  icon: <img src={adminAssets.car_icon} className="w-6 h-6" /> },
  { label: 'Total Bookings',         value: stats.totalBookings,              icon: <img src={adminAssets.listIconColored} className="w-6 h-6" /> },
  { label: 'Pending Owner Verif.',   value: stats.pendingOwnerVerifications,  icon: <img src={adminAssets.hourglass} className="w-6 h-6" /> },
  { label: 'Pending Car Verif.',     value: stats.pendingCarVerifications,    icon: <img src={adminAssets.circle_minus} className="w-6 h-6" /> },
  { label: 'Pending Renter Verif.', value: stats.pendingRenterVerifications, icon: <img src={adminAssets.pend_booking} className="w-6 h-6" /> },
] : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#5f6FFF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">Dashboard Overview</h2>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Recent Bookings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-left">
                <th className="px-6 py-3 font-medium">#</th>
                <th className="px-6 py-3 font-medium">Car</th>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No bookings yet</td>
                </tr>
              ) : recentBookings.map((b, i) => (
                <tr key={b._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-400">{i + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {b.car?.images?.[0] && (
                        <img src={b.car.images[0]} alt="" className="w-8 h-8 rounded object-cover" />
                      )}
                      <span className="font-medium text-gray-700">{b.car?.brand} {b.car?.model}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-700">{b.user?.name}</p>
                    <p className="text-xs text-gray-400">{b.user?.email}</p>
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                  <td className="px-6 py-4 text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard