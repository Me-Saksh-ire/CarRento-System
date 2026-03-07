import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'
import { assets, menuLinks } from '../assets/assets'

const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'

const Navbar = () => {
    const { setShowLogin, user, logout, isOwner, axios, setIsOwner } = useAppContext()
    const location = useLocation()
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()

    const isAdmin = user?.role === 'admin'

    const changeRole = async () => {
        try {
            const { data } = await axios.post('/api/owner/change-role')
            if (data.success) {
                setIsOwner(true)
                toast.success(data.message)
                navigate('/owner/verification')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleActionButton = () => {
        if (isOwner) return navigate('/owner')
        changeRole()
    }

    const buttonLabel = isOwner ? 'Dashboard' : 'List Cars'

    return (
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`flex items-center justify-between px-6 md:px-16 lg:px-24 xl:px-32 py-4 text-gray-600 border-b border-borderColor relative transition-all ${location.pathname === '/' && 'bg-light'}`}
        >
            {/* Logo */}
            <Link to='/'>
                <motion.img whileHover={{ scale: 1.05 }} src={assets.logo} alt="logo" className='h-10' />
            </Link>

            {/* Nav links + buttons */}
            <div className={`max-sm:fixed max-sm:h-screen max-sm:w-full max-sm:top-16 maz-sm:border-t border-borderColor flex flex-col right-0 sm:flex-row items-start sm:items-center gap-4 sm:gap-8 max-sm:p-4 transition-all duration-300 z-50 ${location.pathname === '/' ? 'bg-light' : 'bg-white'
                } ${open ? 'max-sm:translate-x-0' : 'max-sm:translate-x-full'}`}>

                {menuLinks.map((link, index) => (
                    <Link key={index} to={link.path}>{link.name}</Link>
                ))}

                <div className='flex max-sm:flex-col gap-6 items-start sm:items-center'>

                    {/* ── Admin Panel button — ONLY visible to admin role ── */}
                    {isAdmin  && (
                        <motion.a
                            href={ADMIN_APP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            className='cursor-pointer px-3 py-1 border border-primary text-primary rounded-full text-xs font-light hover:bg-primary hover:text-white transition-all'
                        >
                            Admin Panel
                        </motion.a>
                    )}

                    {/* List Cars / Dashboard — hidden from admin */}
                    {!isAdmin && (
                        <button onClick={handleActionButton} className='cursor-pointer'>
                            {buttonLabel}
                        </button>
                    )}

                    {/* Login / Logout */}
                    <button
                        onClick={() => { user ? logout() : setShowLogin(true) }}
                        className='cursor-pointer px-8 py-2 bg-primary hover:bg-primary-dull transition-all text-white rounded-lg'
                    >
                        {user ? 'Logout' : 'Login'}
                    </button>

                </div>
            </div>

            {/* Hamburger (mobile) */}
            <button onClick={() => setOpen(!open)} aria-label='Menu' className='sm:hidden cursor-pointer'>
                <img src={open ? assets.close_icon : assets.menu_icon} alt="Menu" />
            </button>
        </motion.div>
    )
}

export default Navbar