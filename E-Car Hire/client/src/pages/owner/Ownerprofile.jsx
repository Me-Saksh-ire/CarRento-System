import React, { useState, useEffect } from 'react'
import Title from '../../components/owner/Title'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const OwnerProfile = () => {
  const { user, axios, fetchUser } = useAppContext()

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
      })
    }
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await axios.post('/api/owner/owner-profile', {
        name: form.name,
        phone: form.phone,
      })
      if (data.success) {
        toast.success('Profile updated successfully!')
        fetchUser()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
    setLoading(false)
  }

  return (
    <div className='px-4 pt-10 md:px-10 flex-1 max-w-xl'>
      <Title
        title='My Profile'
        subTitle='Update your personal information shown to renters and on your account.'
      />

      <form onSubmit={handleSave} className='mt-6 bg-white p-6 rounded-xl border border-borderColor space-y-4'>

        {/* Profile photo preview */}
        <div className='flex items-center gap-4 mb-2'>
          <img
            src={user?.image || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=300'}
            alt='Profile'
            className='w-16 h-16 rounded-full object-cover border-2 border-borderColor'
          />
          <div>
            <p className='font-medium text-gray-800'>{user?.name}</p>
            <p className='text-xs text-gray-400'>
              {user?.ownerVerification?.status === 'verified'
                ? 'Verified Owner'
                : user?.ownerVerification?.status === 'pending'
                  ? 'Verification pending'
                  : 'Not yet verified — go to Verification tab'}
            </p>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className='block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5'>
            Full Name
          </label>
          <input
            type='text'
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder='Your full name'
            required
            className='w-full px-4 py-2.5 border border-borderColor rounded-lg text-sm
              focus:outline-none focus:border-primary transition-all'
          />
        </div>

        {/* Phone */}
        <div>
          <label className='block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5'>
            Phone Number
          </label>
          <input
            type='tel'
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            placeholder='+91 9876543210'
            className='w-full px-4 py-2.5 border border-borderColor rounded-lg text-sm
              focus:outline-none focus:border-primary transition-all'
          />
        </div>

        {/* Email — read only */}
        <div>
          <label className='block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5'>
            Email Address <span className='normal-case text-gray-400'>(read-only)</span>
          </label>
          <input
            type='email'
            value={form.email}
            readOnly
            className='w-full px-4 py-2.5 border border-borderColor rounded-lg text-sm
              bg-gray-50 text-gray-400 cursor-not-allowed'
          />
        </div>

        {/* Role badge */}
        <div>
          <label className='block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5'>
            Account Role
          </label>
          <div className='w-full px-4 py-2.5 border border-borderColor rounded-lg text-sm
            bg-gray-50 text-gray-500 flex justify-between'>
            <span>{user?.role === 'owner' ? 'Owner Account' : 'Renter Account'}</span>
            <span className='text-xs text-gray-400'>Read only</span>
          </div>
        </div>

        {/* Save button */}
        <div className='flex justify-end pt-1'>
          <button
            type='submit'
            disabled={loading}
            className='flex items-center gap-2 px-10 py-2.5 bg-primary text-white rounded-lg
              text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-60
              disabled:cursor-not-allowed'
          >
            {loading
              ? <><div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />Saving...</>
              : 'Save Changes'}
          </button>
        </div>

      </form>
    </div>
  )
}

export default OwnerProfile