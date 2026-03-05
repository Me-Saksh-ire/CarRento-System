import React, { useEffect, useState, useRef } from 'react'
import Title from '../components/Title'
import { motion, AnimatePresence } from 'motion/react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { assets } from '../assets/assets'

const UserProfile = () => {
  const { axios, user, setUser } = useAppContext()

  const [loading, setLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef(null)

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    licenceNumber: '',
    address: '',
  })

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        licenceNumber: user.licenceNumber || '',
        address: user.address || '',
      })
    }
  }, [user])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    if (!profileForm.name.trim()) return toast.error('Name cannot be empty')
    setLoading(true)
    try {
      const { data } = await axios.put('/api/user/user-profile', profileForm)
      if (data.success) {
        setUser(data.user)
        toast.success('Profile updated successfully!')
        setIsEditing(false)
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB')
    setImageLoading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await axios.post('/api/user/update-image', formData)
      if (data.success) {
        setUser(prev => ({ ...prev, image: data.image }))
        toast.success('Profile photo updated!')
      } else {
        toast.error(data.message)
      }
    } catch (err) {
      toast.error(err.message)
    }
    setImageLoading(false)
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const isProfileComplete = profileForm.phone && profileForm.licenceNumber

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='mt-10 px-4 md:px-16 lg:px-24 xl:px-32 max-w-4xl pb-24'
    >
      <Title
        title="User Profile"
        subTitle="Your information is shared with the car owner after a confirmed booking"
        align="left"
      />

      {/* ── Profile Hero Card ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='mt-8 rounded-2xl overflow-hidden border border-gray-200 shadow-sm'
      >
        {/* Gradient banner */}
        <div className='h-14 bg-linear-to-r relative'>
          <div className='absolute inset-0 opacity-20'
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>

        {/* Avatar + info row */}
        <div className='bg-white px-6 pb-5'>
          <div className='flex flex-col sm:flex-row sm:items-end gap-4 -mt-10'>

            {/* Avatar */}
            <div className='relative w-fit'>
              <motion.div
                whileHover={{ scale: 1.05 }}
                onClick={() => fileInputRef.current?.click()}
                className='w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex items-center justify-center cursor-pointer bg-linear-to-br from-primary to-indigo-500'
                title='Click to change photo'
              >
                {imageLoading
                  ? <div className='w-5 h-5 rounded-full animate-spin' />
                  : user?.image
                    ? <img src={user.image} alt='Profile' className='w-full h-full object-cover' />
                    : <span className='text-white text-2xl font-bold'>{initials}</span>
                }
              </motion.div>
              {/* Camera badge */}
              <div className='absolute -bottom-1 -right-1 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm text-xs pointer-events-none'>
                <img src={assets.camera} className='h-3 w-3 text-gray-500' alt="camera" />
              </div>
              <input ref={fileInputRef} type='file' accept='image/*' className='hidden' onChange={handleImageUpload} />
            </div>

            {/* Name + status */}
            <div className='flex-1 pb-1'>
              <div className='flex flex-wrap items-center gap-2'>
                <h2 className='text-lg font-bold text-gray-900'>{user?.name || 'User'}</h2>
                <span className={`px-2.5 py-0.5 text-xs rounded-full font-medium border ${isProfileComplete
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                  {isProfileComplete ? '✓ Complete' : '⚠ Incomplete'}
                </span>
                <span className='px-2.5 py-0.5 text-xs rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-100 capitalize'>
                  User
                </span>
              </div>
              <p className='text-gray-400 text-xs mt-0.5'>{user?.email}</p>
            </div>

            {/* Right side — member since + edit */}
            <div className='flex sm:flex-col items-center sm:items-end gap-3 pb-1'>
              <div className='text-right hidden sm:block'>
                <p className='text-[10px] text-gray-400 uppercase tracking-wider'>Member since</p>
                <p className='text-sm font-semibold text-gray-700'>
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
                    : '—'}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsEditing(!isEditing)}
                className={`group px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isEditing
                  ? 'border-gray-300 text-gray-500 bg-gray-50'
                  : 'border-primary text-primary hover:bg-primary hover:text-white'
                  }`}
              >
                {isEditing ? (
                  <div className='flex items-center gap-1'>
                    <img src={assets.x} className='h-3 w-3' alt="cancel" /> Cancel
                  </div>
                ) : (
                  <div className='flex items-center gap-1'>
                    <img src={assets.pencil} className='h-3 w-3 group-hover:hidden' alt="edit" />
                    <img src={assets.pencilColored} className='h-3 w-3 hidden group-hover:block' alt="edit" />
                    Edit Profile
                  </div>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Incomplete warning ────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isProfileComplete && !isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3'
          >
            <p className='text-xs text-amber-800'>
              ⚠️ Add your <strong>phone number</strong> and <strong>driving licence</strong> so the owner can contact you at pickup.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className='shrink-0 text-xs font-semibold text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-all'
            >
              Complete Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode='wait'>

        {/* ══ VIEW MODE ══════════════════════════════════════════════════════ */}
        {!isEditing && (
          <motion.div
            key='view'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className='mt-5 space-y-4'
          >
            {/* Personal Info card */}
            <div className='bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm'>
              <div className='px-6 py-4 border-b border-gray-100 flex items-center gap-2'>
                <span className='text-base'><img src={assets.userIcon} className='h-4 w-4' alt="user" /></span>
                <h3 className='font-semibold text-gray-800 text-sm'>Personal Information</h3>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100'>
                {[
                  { label: 'Full Name', value: profileForm.name, icon: <img src={assets.userIcon} className='h-4 w-4' alt="user" />, mono: false },
                  { label: 'Email Address', value: profileForm.email, icon: <img src={assets.mail} className='h-4 w-4' alt="mail" />, mono: false },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className='px-6 py-4'
                  >
                    <p className='text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1'>{item.label}</p>
                    <p className={`text-sm font-semibold ${item.value ? 'text-gray-800' : 'text-gray-300 italic'}`}>
                      {item.value || 'Not provided'}
                    </p>
                  </motion.div>
                ))}
              </div>
              <div className='border-t border-gray-100 px-6 py-4'>
                <p className='text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1'>Phone Number</p>
                <p className={`text-sm font-semibold ${profileForm.phone ? 'text-gray-800' : 'text-gray-300 italic'}`}>
                  {profileForm.phone ? `+91 ${profileForm.phone}` : 'Not provided'}
                </p>
              </div>
            </div>

            {/* Rental Details card */}
            <div className='bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm'>
              <div className='px-6 py-4 border-b border-gray-100 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <span className='text-base'><img src={assets.id_card} className='h-4 w-4' alt="id card" /></span>
                  <h3 className='font-semibold text-gray-800 text-sm'>Rental Details</h3>
                </div>
                
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100'>
                <div className='px-6 py-4'>
                  <p className='text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1'>Driving Licence</p>
                  <p className={`text-sm font-semibold font-mono ${profileForm.licenceNumber ? 'text-gray-800' : 'text-gray-300 italic font-sans'}`}>
                    {profileForm.licenceNumber || 'Not provided'}
                  </p>
                </div>
                <div className='px-6 py-4'>
                  <p className='text-[10px] text-gray-400 uppercase tracking-widest font-medium mb-1'>Home Address</p>
                  <p className={`text-sm font-semibold leading-relaxed ${profileForm.address ? 'text-gray-800' : 'text-gray-300 italic'}`}>
                    {profileForm.address || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Owner preview card */}
            <div className='bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5'>
              <p className='text-xs font-semibold text-blue-800 mb-4 flex items-center gap-1.5'>
                <span className='text-base'>ℹ️</span>
                What the car owner receives after your booking is confirmed & paid
              </p>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {[
                  { icon: <img src={assets.userIcon} className='h-4 w-4' alt="user" />, label: 'Name', value: profileForm.name, fallback: 'Not set' },
                  { icon: <img src={assets.phone} className='h-4 w-4' alt="phone" />, label: 'Phone', value: profileForm.phone ? `+91 ${profileForm.phone}` : '', fallback: 'Not set' },
                  { icon: <img src={assets.id_card} className='h-4 w-4' alt="id card" />, label: 'Driving Licence', value: profileForm.licenceNumber, fallback: 'Not set' },
                  { icon: <img src={assets.mail} className='h-4 w-4' alt="gmail" />, label: 'Email', value: profileForm.email, fallback: 'Not set' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className='flex items-center gap-3 bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl border border-blue-100'
                  >
                    <span className='text-base shrink-0'>{item.icon}</span>
                    <div className='min-w-0'>
                      <p className='text-[10px] text-blue-400 uppercase tracking-wider font-medium'>{item.label}</p>
                      <p className={`text-xs font-semibold truncate ${item.value ? 'text-blue-900' : 'text-blue-300 italic'}`}>
                        {item.value || item.fallback}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ EDIT MODE ══════════════════════════════════════════════════════ */}
        {isEditing && (
          <motion.div
            key='edit'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <form onSubmit={handleProfileUpdate} className='mt-5 space-y-4'>

              {/* Personal Info */}
              <div className='bg-white border border-gray-200 rounded-2xl p-6 shadow-sm'>
                <h3 className='font-semibold text-gray-800 mb-5 flex items-center gap-2'>
                  <span>👤</span> Personal Information
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5'>Full Name</label>
                    <input
                      type='text'
                      value={profileForm.name}
                      onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      placeholder='Enter your full name'
                      required
                      className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all'
                    />
                  </div>

                  <div>
                    <label className='block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5'>Email Address</label>
                    <input
                      type='email'
                      value={profileForm.email}
                      onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                      placeholder='Enter your email'
                      required
                      className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all'
                    />
                  </div>

                  <div>
                    <label className='block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5'>
                      Phone Number <span className='normal-case text-gray-400 font-normal'>(shared with owner)</span>
                    </label>
                    <div className='flex'>
                      <span className='px-3 py-2.5 bg-gray-50 border border-gray-200 border-r-0 rounded-l-xl text-sm text-gray-500 font-medium'>+91</span>
                      <input
                        type='tel'
                        maxLength={10}
                        value={profileForm.phone}
                        onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder='9876543210'
                        className='flex-1 px-4 py-2.5 border border-gray-200 rounded-r-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all'
                      />
                    </div>
                  </div>

                  <div>
                    <label className='block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5'>Account Role</label>
                    <div className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 flex justify-between items-center'>
                      <span className='capitalize'>Renter Account</span>
                      <span className='text-xs text-gray-400'>Read only</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rental Details */}
              <div className='bg-white border border-gray-200 rounded-2xl p-6 shadow-sm'>
                <div className='flex items-center justify-between mb-5'>
                  <h3 className='font-semibold text-gray-800 flex items-center gap-2'>
                    <span>🪪</span> Rental Details
                  </h3>
                  <span className='text-[10px] px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-medium'>
                    📤 Shared after booking
                  </span>
                </div>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5'>
                      Driving Licence Number <span className='normal-case text-red-400 font-normal'>* required at pickup</span>
                    </label>
                    <input
                      type='text'
                      value={profileForm.licenceNumber}
                      onChange={e => setProfileForm(p => ({ ...p, licenceNumber: e.target.value }))}
                      placeholder='e.g. MH01 20230012345'
                      className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all'
                    />
                  </div>

                  <div>
                    <label className='block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5'>Home Address</label>
                    <textarea
                      rows={2}
                      value={profileForm.address}
                      onChange={e => setProfileForm(p => ({ ...p, address: e.target.value }))}
                      placeholder='Your home address'
                      className='w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none'
                    />
                  </div>
                </div>

                {/* Live preview */}
                <div className='mt-5 p-4 bg-blue-50 border border-blue-100 rounded-xl'>
                  <p className='text-xs font-semibold text-blue-800 mb-3'>ℹ️ Owner will see:</p>
                  <div className='grid grid-cols-2 gap-2'>
                    {[
                      { icon: '👤', label: 'Name', value: profileForm.name },
                      { icon: '📞', label: 'Phone', value: profileForm.phone ? `+91 ${profileForm.phone}` : '' },
                      { icon: '🪪', label: 'Licence', value: profileForm.licenceNumber },
                      { icon: '📧', label: 'Email', value: profileForm.email },
                    ].map((item, i) => (
                      <div key={i} className='flex items-center gap-2 text-xs text-blue-700'>
                        <span>{item.icon}</span>
                        <span className='text-blue-400 shrink-0'>{item.label}:</span>
                        <span className='font-semibold text-blue-900 truncate'>{item.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className='flex gap-3 justify-end pt-1'>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type='button'
                  onClick={() => {
                    setProfileForm({
                      name: user?.name || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                      licenceNumber: user?.licenceNumber || '',
                      address: user?.address || '',
                    })
                    setIsEditing(false)
                  }}
                  className='px-6 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all'
                >
                  Cancel
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type='submit'
                  disabled={loading}
                  className='flex items-center gap-2 px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-primary/30'
                >
                  {loading
                    ? <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />Saving...</>
                    : '✓ Save Changes'}
                </motion.button>
              </div>

            </form>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}

export default UserProfile