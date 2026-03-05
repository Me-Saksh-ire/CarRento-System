// admin/src/components/AdminNavbar.jsx
import { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
import { assets } from '../../../client/src/assets/assets'


const AdminNavbar = () => {
  const { adminLogout } = useContext(AdminContext)

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 sticky top-0 z-40">
      {/* Logo + badge */}
      <div className="flex items-center gap-3">

        <img src={assets.logo} alt="logo" className='h-10' />

        <span className="text-xs bg-[#EEF0FF] text-[#5f6FFF] font-medium px-3 py-1 rounded-full">
          Admin
        </span>
      </div>

      {/* Logout */}
      <button
        onClick={adminLogout}
        className="px-6 py-2 bg-[#5f6FFF] hover:bg-[#4a5ae8] text-white text-sm font-medium rounded-full transition-all"
      >
        Logout
      </button>
    </div>
  )
}

export default AdminNavbar