// admin/src/pages/AdminCarVerifications.jsx
import { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../context/AdminContext'
import toast from 'react-hot-toast'

const StatusBadge = ({ status }) => {
  const map = {
    verified: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${map[status ?? 'pending'] ?? 'bg-gray-100 text-gray-600'}`}>
      {status ?? 'pending'}
    </span>
  )
}

// Full-screen image lightbox
const ImageLightbox = ({ src, label, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'lightboxIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Label */}
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-white font-semibold text-sm tracking-wide">{label}</p>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-xl leading-none transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Image */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)' }}
        >
          <img src={src} alt={label} className="w-full max-h-[75vh] object-contain bg-slate-900" />
        </div>

        <p className="text-center text-white/30 text-xs mt-3">Press Esc or click outside to close</p>
      </div>

      <style>{`
        @keyframes lightboxIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

// Filter tabs
const TABS = ['all', 'pending', 'verified', 'rejected']

const AdminCarVerifications = () => {
  const { api } = useContext(AdminContext)
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [viewCar, setViewCar] = useState(null)
  const [mainImageIndex, setMainImageIndex] = useState(0)
  const [lightbox, setLightbox] = useState(null) // { src, label }

  const fetchCars = async (status = tab) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/api/admin/cars${status !== 'all' ? `?status=${status}` : ''}`)
      if (data.success) setCars(data.cars)
      else toast.error(data.message)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCars(tab) }, [tab])

  const handleApprove = async (carId) => {
    try {
      const { data } = await api.post('/api/admin/cars/approve', { carId })
      if (data.success) { toast.success(data.message); fetchCars(tab) }
      else toast.error(data.message)
    } catch (e) { toast.error(e.message) }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    try {
      const { data } = await api.post('/api/admin/cars/reject', { carId: rejectModal, reason: rejectReason })
      if (data.success) {
        toast.success(data.message)
        setRejectModal(null)
        setRejectReason('')
        fetchCars(tab)
      } else toast.error(data.message)
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-gray-700">Car Verifications</h2>

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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-4 border-[#5f6FFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : cars.length === 0 ? (
            <p className="text-center text-gray-400 py-16">No cars found</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-left">
                  <th className="px-6 py-3 font-medium">Car</th>
                  <th className="px-6 py-3 font-medium">Owner</th>
                  <th className="px-6 py-3 font-medium">Details</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cars.map((car) => (
                  <tr key={car._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {car.images?.[0] && (
                          <img src={car.images[0]} alt="" className="w-14 h-10 rounded object-cover border border-gray-100" />
                        )}
                        <div>
                          <p className="font-medium text-gray-700">{car.brand} {car.model}</p>
                          <p className="text-xs text-gray-400">{car.year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-700">{car.owner?.name}</p>
                      <p className="text-xs text-gray-400">{car.owner?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <p>₹{car.pricePerDay?.toLocaleString()}/day</p>
                      <p className="text-xs text-gray-400">{car.location}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={car.isVerified} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewCar(car)}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-all"
                        >
                          View Details
                        </button>
                      </div>
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
            <h3 className="font-semibold text-gray-700 mb-1">Reject / Revoke Car</h3>
            <p className="text-sm text-gray-400 mb-4">Provide a reason to help the owner understand.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Documents unclear, please re-upload RC book..."
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

      {/* View Details Modal */}
      {viewCar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl overflow-auto max-h-[90vh]"
            style={{ boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05)' }}>

            {/* Header Banner */}
            <div className="bg-linear-to-r from-slate-800 to-slate-700 px-6 py-4 rounded-t-2xl">
              <h3 className="font-semibold text-white text-base tracking-wide">Car Details</h3>
              <p className="text-sm text-slate-400 mt-0.5">Inspect images and owner documents before approving.</p>
            </div>

            <div className="flex gap-5 p-6">
              <div className="flex-1 min-w-0">

                {/* Main Image */}
                <div className="mb-4">
                  <div className="w-full h-72 bg-gray-100 rounded-xl overflow-hidden"
                    style={{ boxShadow: '0 8px 24px -4px rgba(0,0,0,0.18), 0 2px 8px -2px rgba(0,0,0,0.1)' }}>
                    {viewCar.images?.[mainImageIndex] ? (
                      <img src={viewCar.images[mainImageIndex]} alt="car" className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">No image</div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {(viewCar.images || []).map((img, i) => (
                      <button key={i} onClick={() => setMainImageIndex(i)}
                        className={`w-20 h-12 rounded-lg overflow-hidden transition-all duration-150 ${i === mainImageIndex
                          ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105'
                          : 'opacity-60 hover:opacity-90 hover:scale-105'
                          }`}
                        style={{ boxShadow: i === mainImageIndex ? '0 4px 12px rgba(99,102,241,0.35)' : '0 2px 6px rgba(0,0,0,0.12)' }}>
                        <img src={img} alt="thumb" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Car + Owner Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Vehicle</p>
                    <p className="text-sm font-semibold text-slate-800">{viewCar.brand} {viewCar.model} — {viewCar.year}</p>
                    <p className="text-sm text-indigo-600 font-medium mt-1">₹{viewCar.pricePerDay?.toLocaleString()}/day</p>
                    <p className="text-sm text-slate-500 mt-1">📍 {viewCar.location}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)' }}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Owner</p>
                    <p className="text-sm font-semibold text-slate-800">{viewCar.owner?.name}</p>
                    <p className="text-sm text-slate-500">{viewCar.owner?.email}</p>
                    <p className="text-xs text-slate-400 mt-2">Profile Licence: <span className="text-slate-600">{viewCar.owner?.licenceNumber || '—'}</span></p>
                    <p className="text-xs text-slate-400">Renter Licence: <span className="text-slate-600">{viewCar.owner?.renterVerification?.licenceNumber || '—'}</span></p>
                  </div>
                </div>

                {/* Owner Documents */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Owner Documents</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'RC Book', img: viewCar.owner?.ownerVerification?.rcImage, alt: 'rc' },
                      { label: 'Aadhar', img: viewCar.owner?.ownerVerification?.aadharImage, alt: 'aadhar' },
                      { label: 'Selfie', img: viewCar.owner?.ownerVerification?.selfieImage, alt: 'selfie' },
                    ].map(({ label, img, alt }) => (
                      <div
                        key={label}
                        className={`rounded-xl overflow-hidden border border-slate-100 bg-slate-50 transition-all duration-200 ${img ? 'group cursor-pointer hover:-translate-y-1' : ''}`}
                        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)' }}
                        onClick={() => img && setLightbox({ src: img, label })}
                        onMouseEnter={e => {
                          if (img) e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.9)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)'
                        }}
                      >
                        {/* Card label bar */}
                        <p className="text-xs font-medium text-slate-500 text-center py-2 border-b border-slate-100 bg-white">{label}</p>

                        {img ? (
                          <div className="relative w-full h-36 overflow-hidden">
                            <img
                              src={img}
                              alt={alt}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-1">
                                <div
                                  className="w-9 h-9 rounded-full flex items-center justify-center"
                                  style={{ background: 'rgba(255,255,255,0.92)', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 8v6M8 11h6" />
                                  </svg>
                                </div>
                                <span className="text-white text-xs font-medium" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                                  View full
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-36 flex items-center justify-center text-xs text-slate-300">Not submitted</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Actions */}
              <div className="w-44 shrink-0">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 sticky top-0"
                  style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Status</p>
                  <div className="mb-4"><StatusBadge status={viewCar.isVerified} /></div>

                  <button
                    onClick={async () => { await handleApprove(viewCar._id); setViewCar(null) }}
                    className="w-full px-3 py-2 mb-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-lg text-sm font-medium transition-all duration-150"
                    style={{ boxShadow: '0 4px 12px rgba(16,185,129,0.35)' }}>
                    Approve
                  </button>
                  <button
                    onClick={() => { setRejectModal(viewCar._id); setViewCar(null) }}
                    className="w-full px-3 py-2 mb-2 bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 rounded-lg border border-red-200 text-sm font-medium transition-all duration-150"
                    style={{ boxShadow: '0 2px 8px rgba(239,68,68,0.15)' }}>
                    Reject 
                  </button>
                  <button
                    onClick={() => setViewCar(null)}
                    className="w-full px-3 py-2 bg-white hover:bg-slate-50 active:scale-95 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium transition-all duration-150 mt-1"
                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Image Lightbox */}
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          label={lightbox.label}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}

export default AdminCarVerifications