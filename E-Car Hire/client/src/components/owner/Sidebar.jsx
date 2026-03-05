import React, { useState } from 'react'
import { assets, ownerMenuLinks } from '../../assets/assets'
import { NavLink, useLocation } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'

const Sidebar = () => {
  const { user, axios, fetchUser } = useAppContext()
  const location = useLocation()
  const [image, setImage] = useState()

  const updateImage = async () => {
    try {
      const formData = new FormData()
      formData.append('image', image)
      const { data } = await axios.post('/api/owner/update-image', formData)
      if (data.success) {
        fetchUser()
        toast.success(data.message)
        setImage()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // ── Shorthand ───────────────────────────────────────────────────────────
  const verStatus = user?.ownerVerification?.status  // 'not_submitted' | 'pending' | 'verified' | 'rejected'
  const isVerified = verStatus === 'verified'
  const isPending  = verStatus === 'pending'
  const isRejected = verStatus === 'rejected'

  return (
    <div className='relative min-h-screen md:flex flex-col items-center pt-8 w-16 md:w-64
      border-r border-borderColor text-sm bg-white'>

      {/* ── Profile photo ──────────────────────────────────────────────── */}
      <div className='group relative'>
        <label htmlFor='image'>
          <img
            src={image
              ? URL.createObjectURL(image)
              : user?.image || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=300'}
            alt=''
            className='h-13 md:h-17 md:w-17 w-13 rounded-full mx-auto object-cover'
          />
          <input
            type='file'
            id='image'
            accept='image/*'
            hidden
            onChange={e => setImage(e.target.files[0])}
          />
          <div className='absolute hidden top-0 right-0 left-0 bottom-0 bg-black/10 rounded-full
            group-hover:flex items-center justify-center cursor-pointer'>
            <img src={assets.edit_icon} alt='' />
          </div>
        </label>
      </div>

      {/* Save photo button */}
      {image && (
        <button
          className='absolute top-0 right-0 flex p-2 gap-1 bg-primary/10 text-primary cursor-pointer text-xs'
          onClick={updateImage}
        >
          Save <img src={assets.check_icon} width={13} alt='' />
        </button>
      )}

      {/* Owner name */}
      <p className='mt-2 text-base max-md:hidden font-medium'>{user?.name}</p>

      {/* ── Verification status badge ─────────────────────────────────── */}
      <div className='max-md:hidden mt-1 mb-2'>
        {isVerified ? (
          <span className='text-xs px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full font-medium'>
            Verified
          </span>
        ) : isPending ? (
          <span className='text-xs px-2.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-medium animate-pulse'>
            Under Review
          </span>
        ) : isRejected ? (
          <span className='text-xs px-2.5 py-0.5 bg-red-100 text-red-600 rounded-full font-medium'>
            Rejected
          </span>
        ) : (
          <span className='text-xs px-2.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium animate-pulse'>
            Not Verified
          </span>
        )}
      </div>

      {/* ── Navigation links ─────────────────────────────────────────── */}
      <div className='w-full mt-2'>
        {ownerMenuLinks.map((link, index) => {
          const isActive      = link.path === location.pathname
          const isVerifyLink  = link.path === '/owner/verification'

          return (
            <NavLink
              key={index}
              to={link.path}
              end={link.path === '/owner'}
              className={`relative flex items-center gap-2 w-full pl-4 py-3 transition-colors
                ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <img
                src={isActive ? link.coloredIcon : link.icon}
                alt=''
                className='w-5 h-5 shrink-0'
              />
              <span className='max-md:hidden'>{link.name}</span>

              {/* ── Badge next to Verification link ────────────────── */}
              {isVerifyLink && (
                isVerified ? (
                  <span className='max-md:hidden ml-auto mr-6 text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full'>
                    Done
                  </span>
                ) : isPending ? (
                  <span className='max-md:hidden ml-auto mr-6 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full'>
                    In Review
                  </span>
                ) : isRejected ? (
                  <span className='max-md:hidden ml-auto mr-6 text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full'>
                    Resubmit
                  </span>
                ) : (
                  <span className='max-md:hidden ml-auto mr-6 text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full'>
                    Action Needed
                  </span>
                )
              )}

              {/* Active bar indicator */}
              <div className={`${isActive ? 'bg-primary' : ''} w-1.5 h-8 rounded-l right-0 absolute`} />
            </NavLink>
          )
        })}
      </div>

    </div>
  )
}

export default Sidebar