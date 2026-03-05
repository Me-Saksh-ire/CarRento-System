// admin/src/pages/AdminRenterVerifications.jsx
import { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../context/AdminContext'
import toast from 'react-hot-toast'

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    verified:      'bg-green-100 text-green-700',
    pending:       'bg-yellow-100 text-yellow-700',
    rejected:      'bg-red-100 text-red-700',
    not_submitted: 'bg-gray-100 text-gray-500',
  }
  const s = status || 'not_submitted'
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${map[s] ?? 'bg-gray-100 text-gray-500'}`}>
      {s.replace('_', ' ')}
    </span>
  )
}

const TABS = ['all', 'pending', 'verified', 'rejected']

const AdminRenterVerifications = () => {
  const { api } = useContext(AdminContext)
  const [users, setUsers]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState('pending')
  const [actionModal, setActionModal] = useState(null) // { userId, type: 'approve'|'reject' }
  const [rejectReason, setRejectReason] = useState('')

  // ── Fetch users by renterVerification status ──────────────────────────────
  const fetchUsers = async (status = tab) => {
    setLoading(true)
    try {
      // ✅ No role filter — backend filters by renterVerification.status only
      const url = status === 'all'
        ? '/api/admin/users'
        : `/api/admin/users?status=${status}`

      const { data } = await api.get(url)
      if (data.success) {
        setUsers(data.users)
      } else {
        toast.error(data.message)
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers(tab) }, [tab])

  // ── Approve / Reject action ───────────────────────────────────────────────
  const handleAction = async () => {
    if (!actionModal) return
    try {
      const { data } = await api.post('/api/admin/users/verify-renter', {
        userId: actionModal.userId,
        action: actionModal.type,
        reason: rejectReason,
      })
      if (data.success) {
        toast.success(data.message)
        setActionModal(null)
        setRejectReason('')
        fetchUsers(tab)
      } else {
        toast.error(data.message)
      }
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-gray-700">User Verifications</h2>

      {/* ── Tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all border ${
              tab === t
                ? 'bg-[#5f6FFF] text-white border-[#5f6FFF]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#5f6FFF] hover:text-[#5f6FFF]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-4 border-[#5f6FFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-400 py-16">No verification requests found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-left">
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Submitted</th>
                  <th className="px-6 py-3 font-medium">Licence Number</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const rv     = user.renterVerification   // shorthand
                  const status = rv?.status || 'not_submitted'

                  return (
                    <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">

                      {/* User info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img src={user.image} alt="" className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#EEF0FF] flex items-center justify-center text-[#5f6FFF] font-semibold text-sm">
                              {user.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-700">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role — shows if they're also an owner */}
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                          user.role === 'user'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          Renter
                        </span>
                      </td>

                      {/* Submitted date */}
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {rv?.submittedAt
                          ? new Date(rv.submittedAt).toLocaleDateString('en-IN')
                          : '—'}
                      </td>

                      {/* Licence number */}
                      <td className="px-6 py-4">
                        {rv?.licenceNumber ? (
                          <span className="text-gray-700 text-xs font-mono bg-gray-50 px-2 py-1 rounded">
                            {rv.licenceNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">None</span>
                        )}
                      </td>

                      {/* Status + reject reason */}
                      <td className="px-6 py-4">
                        <StatusBadge status={status} />
                        {rv?.rejectReason && (
                          <p className="text-xs text-red-400 mt-1 max-w-40 truncate" title={rv.rejectReason}>
                            {rv.rejectReason}
                          </p>
                        )}
                      </td>

                      {/* ✅ Actions — based purely on renterVerification.status */}
                      <td className="px-6 py-4">
                        {status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setActionModal({ userId: user._id, type: 'approve' })}
                              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setActionModal({ userId: user._id, type: 'reject' })}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-all border border-red-200"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {status === 'verified' && (
                          <button
                            onClick={() => setActionModal({ userId: user._id, type: 'reject' })}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-all border border-red-200"
                          >
                            Revoke
                          </button>
                        )}

                        {status === 'rejected' && (
                          <span className="text-xs text-gray-400 italic">Awaiting resubmission</span>
                        )}

                        {status === 'not_submitted' && (
                          <span className="text-xs text-gray-400 italic">Not submitted</span>
                        )}
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Approve / Reject Modal ── */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-700 mb-1">
              {actionModal.type === 'approve' ? 'Approve User' : 'Reject / Revoke User'}
            </h3>

            {actionModal.type === 'approve' ? (
              <p className="text-sm text-gray-400 mb-4">
                This will mark the user as verified, allowing them to book cars on the platform.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-400 mb-3">
                  Provide a reason so the user knows what to fix before resubmitting.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Driving licence number format is invalid..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#5f6FFF] resize-none"
                />
              </>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setActionModal(null); setRejectReason('') }}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                className={`flex-1 py-2.5 text-white text-sm font-medium rounded-lg transition-all ${
                  actionModal.type === 'approve'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {actionModal.type === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRenterVerifications