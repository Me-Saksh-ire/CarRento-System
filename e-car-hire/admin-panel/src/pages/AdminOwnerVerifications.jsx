// admin/src/pages/AdminOwnerVerifications.jsx
import { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../context/AdminContext'
import toast from 'react-hot-toast'

// AdminOwnerVerifications.jsx — StatusBadge
const StatusBadge = ({ status }) => {
  const map = {
    verified: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
    unverified: 'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status ?? 'not submitted'}
    </span>
  )
}

const TABS = ['all', 'pending', 'verified', 'rejected']

const AdminOwnerVerifications = () => {
  const { api } = useContext(AdminContext)
  const [owners, setOwners] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [docModal, setDocModal] = useState(null) // owner object

  const fetchOwners = async (status = tab) => {
    setLoading(true)
    try {
      const url = status === 'all'
        ? '/api/admin/owners/all'
        : `/api/admin/owners/all?status=${status}`
      const { data } = await api.get(url)
      if (data.success) setOwners(data.owners)
      else toast.error(data.message)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOwners(tab) }, [tab])

  const handleApprove = async (userId) => {
    try {
      const { data } = await api.post('/api/admin/owners/approve', { userId })
      if (data.success) { toast.success(data.message); fetchOwners(tab) }
      else toast.error(data.message)
    } catch (e) { toast.error(e.message) }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    try {
      const { data } = await api.post('/api/admin/owners/reject', { userId: rejectModal, reason: rejectReason })
      if (data.success) {
        toast.success(data.message)
        setRejectModal(null)
        setRejectReason('')
        fetchOwners(tab)
      } else toast.error(data.message)
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-gray-700">Owner Verifications</h2>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all border ${tab === t
              ? 'bg-[#5f6FFF] text-white border-[#5f6FFF]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#5f6FFF] hover:text-[#5f6FFF]'
              }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-4 border-[#5f6FFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : owners.length === 0 ? (
            <p className="text-center text-gray-400 py-16">No owners found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-left">
                  <th className="px-6 py-3 font-medium">Owner</th>
                  <th className="px-6 py-3 font-medium">Submitted</th>
                  <th className="px-6 py-3 font-medium">Documents</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((owner) => (
                  <tr key={owner._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    {/* Owner info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {owner.image ? (
                          <img src={owner.image} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#EEF0FF] flex items-center justify-center text-[#5f6FFF] font-semibold text-sm">
                            {owner.name?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-700">{owner.name}</p>
                          <p className="text-xs text-gray-400">{owner.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {owner.ownerVerification?.submittedAt
                        ? new Date(owner.ownerVerification.submittedAt).toLocaleDateString()
                        : '—'}
                    </td>

                    <td className="px-6 py-4">
                      {(owner.ownerVerification?.documents?.length > 0 || owner.ownerVerification?.aadharImage) ? (
                        <button
                          onClick={() => setDocModal(owner)}
                          className="text-[#5f6FFF] text-xs font-medium hover:underline"
                        >
                          View docs
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={owner.ownerVerification?.status} />
                      {owner.ownerVerification?.rejectReason && (
                        <p className="text-xs text-red-400 mt-1 max-w-45 truncate">
                          {owner.ownerVerification.rejectReason}
                        </p>
                      )}
                    </td>

                    {/* ✅ Actions — plain <td>, NOT wrapped in <tr> */}
                    <td className="px-6 py-4">
                      {(owner.ownerVerification?.status === 'pending' ||
                        owner.ownerVerification?.status === 'unverified' ||
                        !owner.ownerVerification?.status) && owner.ownerVerification?.submittedAt && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(owner._id)}
                              className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModal(owner._id)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-all border border-red-200"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      {owner.ownerVerification?.status === 'verified' && (
                        <button
                          onClick={() => setRejectModal(owner._id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-all border border-red-200"
                        >
                          Revoke
                        </button>
                      )}
                      {owner.ownerVerification?.status === 'rejected' && (
                        <span className="text-xs text-gray-400">Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-700 mb-1">Reject / Revoke Owner</h3>
            <p className="text-sm text-gray-400 mb-4">Give a clear reason so the owner can resubmit.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Business registration document is missing..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#5f6FFF] resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document preview modal */}
      {docModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Documents — {docModal.name}</h3>
              <button onClick={() => setDocModal(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            {/* Extra info */}
            {(docModal.ownerVerification?.aadharNumber || docModal.ownerVerification?.vehicleRegNo) && (
              <div className="mb-3 text-xs text-gray-500 space-y-1">
                {docModal.ownerVerification?.aadharNumber && (
                  <p>Aadhar: <span className="font-mono text-gray-700">{docModal.ownerVerification.aadharNumber}</span></p>
                )}
                {docModal.ownerVerification?.vehicleRegNo && (
                  <p>RC No: <span className="font-mono text-gray-700">{docModal.ownerVerification.vehicleRegNo}</span></p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Handle flat fields from verificationController */}
              {docModal.ownerVerification?.aadharImage && (
                <a href={docModal.ownerVerification.aadharImage} target="_blank" rel="noreferrer">
                  <div className="relative">
                    <img src={docModal.ownerVerification.aadharImage} alt="Aadhar"
                      className="rounded-lg border border-gray-200 object-cover w-full h-36 hover:opacity-80 transition-all" />
                    <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">Aadhar</span>
                  </div>
                </a>
              )}
              {docModal.ownerVerification?.rcImage && (
                <a href={docModal.ownerVerification.rcImage} target="_blank" rel="noreferrer">
                  <div className="relative">
                    <img src={docModal.ownerVerification.rcImage} alt="RC Book"
                      className="rounded-lg border border-gray-200 object-cover w-full h-36 hover:opacity-80 transition-all" />
                    <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">RC Book</span>
                  </div>
                </a>
              )}
              {docModal.ownerVerification?.selfieImage && (
                <a href={docModal.ownerVerification.selfieImage} target="_blank" rel="noreferrer">
                  <div className="relative">
                    <img src={docModal.ownerVerification.selfieImage} alt="Selfie"
                      className="rounded-lg border border-gray-200 object-cover w-full h-36 hover:opacity-80 transition-all" />
                    <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">Selfie</span>
                  </div>
                </a>
              )}
              {/* Fallback: documents array */}
              {docModal.ownerVerification?.documents?.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`doc-${i}`}
                    className="rounded-lg border border-gray-200 object-cover w-full h-36 hover:opacity-80 transition-all" />
                </a>
              ))}
            </div>

            <button onClick={() => setDocModal(null)}
              className="mt-4 w-full py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-all">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOwnerVerifications