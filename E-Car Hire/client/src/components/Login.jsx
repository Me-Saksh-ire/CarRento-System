import React from 'react'
import { toast } from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom';

const Login = () => {

    const { setShowLogin, axios, setToken, fetchUser } = useAppContext()
    const navigate = useNavigate()

    const [state, setState] = React.useState('login')
    const [loading, setLoading] = React.useState(false)
    const [showNewPass, setShowNewPass] = React.useState(false)
    const [resetToken, setResetToken] = React.useState('')

    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        password: '',
        otp: '',
        newPassword: '',
        confirmPassword: '',
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    // ── Login / Register ─────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const endpoint = state === 'login' ? 'login' : 'register'
            const { data } = await axios.post(`/api/user/${endpoint}`, formData)
            if (data.success) {
                setToken(data.token)
                localStorage.setItem('token', data.token)
                axios.defaults.headers.common['Authorization'] = data.token
                await fetchUser()
                setShowLogin(false)
                navigate('/')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
        setLoading(false)
    }

    // ── Step 1: Send OTP to email ────────────────────────────────────────────
    const handleForgotSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await axios.post('/api/user/forgot-password', { email: formData.email })
            if (data.success) {
                toast.success(data.message)
                setState('verify-otp')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
        setLoading(false)
    }

    // ── Step 2: Verify OTP ───────────────────────────────────────────────────
    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        if (formData.otp.length !== 6) return toast.error('Enter the 6-digit OTP')
        setLoading(true)
        try {
            const { data } = await axios.post('/api/user/verify-reset-otp', {
                email: formData.email,
                otp: formData.otp,
            })
            if (data.success) {
                setResetToken(data.resetToken)
                toast.success('OTP verified!')
                setState('reset-password')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
        setLoading(false)
    }

    // ── Step 3: Set new password ─────────────────────────────────────────────
    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (formData.newPassword.length < 8) return toast.error('Password must be at least 8 characters')
        if (formData.newPassword !== formData.confirmPassword) return toast.error('Passwords do not match')
        setLoading(true)
        try {
            const { data } = await axios.post('/api/user/reset-password', {
                resetToken,
                newPassword: formData.newPassword,
            })
            if (data.success) {
                toast.success(data.message)
                setState('login')
                setFormData({ name: '', email: '', password: '', otp: '', newPassword: '', confirmPassword: '' })
                setResetToken('')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
        setLoading(false)
    }

    // ── Step indicator shown during forgot password flow ─────────────────────
    const ForgotSteps = ({ current }) => {
        const steps = ['forgot', 'verify-otp', 'reset-password']
        const labels = ['Email', 'OTP', 'New Password']
        const idx = steps.indexOf(current)
        return (
            <div className="flex items-center justify-center gap-1 w-full mb-5 mt-1">
                {labels.map((label, i) => (
                    <React.Fragment key={i}>
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                ${i <= idx ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                                {i < idx ? '✓' : i + 1}
                            </div>
                            <span className={`text-xs ${i <= idx ? 'text-primary font-medium' : 'text-gray-400'}`}>
                                {label}
                            </span>
                        </div>
                        {i < 2 && (
                            <div className={`h-px w-8 mb-4 transition-all ${i < idx ? 'bg-primary' : 'bg-gray-200'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>
        )
    }

    return (
        <div
            onClick={() => setShowLogin(false)}
            className='fixed top-0 bottom-0 left-0 right-0 z-100 flex items-center justify-center text-sm text-gray-600 bg-black/50'
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col items-center p-8 py-12 sm:w-[352px] w-full max-w-md text-center border border-gray-300/60 shadow-xl rounded-lg bg-white mx-4"
            >

                {/* LOGIN / REGISTER */}
                {(state === 'login' || state === 'register') && (
                    <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">

                        {/* Title */}
                        <div className="w-full text-center">
                            <h1 className="text-gray-600 text-3xl font-medium">
                                <span className="text-primary">User</span>{' '}
                                {state === 'login' ? 'Login' : 'Sign up'}
                            </h1>
                            <p className="text-gray-500 text-sm mt-2">Please sign in to continue</p>
                        </div>

                        {/* Fields */}
                        <div className="w-full mt-6 space-y-4">

                            {/* Name — register only */}
                            {state === 'register' && (
                                <div className="flex items-center w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden px-6 gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="8" r="5" />
                                        <path d="M20 21a8 8 0 0 0-16 0" />
                                    </svg>
                                    <input type="text" name="name" placeholder="Name"
                                        className="w-full border-none outline-none ring-0 bg-transparent"
                                        value={formData.name} onChange={handleChange} required />
                                </div>
                            )}

                            {/* Email */}
                            <div className="flex items-center w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden px-6 gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                </svg>
                                <input type="email" name="email" placeholder="Email id"
                                    className="w-full border-none outline-none ring-0 bg-transparent"
                                    value={formData.email} onChange={handleChange} required />
                            </div>

                            {/* Password */}
                            <div className="flex items-center w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden px-6 gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    type={'password'}
                                    name="password" placeholder="Password"
                                    className="w-full border-none outline-none ring-0 bg-transparent"
                                    value={formData.password} onChange={handleChange} required />
                                
                            </div>
                        </div>

                        {/* Forgot password link — login only */}
                        {state === 'login' && (
                            <div className="w-full text-left mt-4">
                                <button
                                    type="button"
                                    onClick={() => setState('forgot')}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-4 w-full h-11 rounded-full text-white bg-primary hover:bg-blue-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {loading
                                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Loading...</>
                                : state === 'login' ? 'Login' : 'Sign up'}
                        </button>

                        {/* Toggle login/register */}
                        <div className="w-full text-center mt-3">
                            <p className="text-gray-500 text-sm">
                                {state === 'login' ? "Don't have an account?" : 'Already have an account?'}
                                <button
                                    type="button"
                                    onClick={() => setState(prev => prev === 'login' ? 'register' : 'login')}
                                    className="ml-1 text-primary hover:underline focus:outline-none"
                                >
                                    Click here
                                </button>
                            </p>
                        </div>
                    </form>
                )}


                {/* FORGOT PASSWORD — Step 1: Enter email */}
                {state === 'forgot' && (
                    <form onSubmit={handleForgotSubmit} className="w-full flex flex-col items-center">
                        <div className="w-full text-center mb-2">
                            <h1 className="text-gray-600 text-3xl font-medium">
                                <span className="text-primary">Reset</span> Password
                            </h1>
                            <p className="text-gray-500 text-sm mt-2">
                                Enter your email to receive a 6-digit OTP
                            </p>
                        </div>

                        <ForgotSteps current="forgot" />

                        <div className="w-full space-y-4">
                            <div className="flex items-center w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden px-6 gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
                                    <rect x="2" y="4" width="20" height="16" rx="2" />
                                </svg>
                                <input type="email" name="email" placeholder="Registered email address"
                                    className="w-full border-none outline-none ring-0 bg-transparent"
                                    value={formData.email} onChange={handleChange} required />
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="mt-6 w-full h-11 rounded-full text-white bg-primary hover:bg-blue-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading
                                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                                : 'Send OTP'}
                        </button>

                        <button type="button" onClick={() => setState('login')}
                            className="text-gray-400 text-sm mt-4 hover:text-primary transition-colors">
                            ← Back to Login
                        </button>
                    </form>
                )}


                {/* 
                    FORGOT PASSWORD — Step 2: Verify OTP
                 */}
                {state === 'verify-otp' && (
                    <form onSubmit={handleVerifyOtp} className="w-full flex flex-col items-center">
                        <div className="w-full text-center mb-2">
                            <h1 className="text-gray-600 text-3xl font-medium">
                                <span className="text-primary">Enter</span> OTP
                            </h1>
                            <p className="text-gray-500 text-sm mt-2">
                                We sent a 6-digit code to<br />
                                <span className="text-primary font-medium">{formData.email}</span>
                            </p>
                        </div>

                        <ForgotSteps current="verify-otp" />

                        <div className="w-full space-y-2">
                            <div className="flex items-center w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden px-6 gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="7.5" cy="15.5" r="5.5" />
                                    <path d="m21 2-9.6 9.6" />
                                    <path d="m15.5 7.5 3 3L22 7l-3-3" />
                                </svg>
                                <input
                                    type="text"
                                    name="otp"
                                    placeholder="Enter 6-digit OTP"
                                    maxLength={6}
                                    className="w-full border-none outline-none ring-0 bg-transparent tracking-widest font-mono text-center text-lg"
                                    value={formData.otp}
                                    onChange={(e) => setFormData(p => ({ ...p, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-400 text-left px-2">OTP is valid for 10 minutes</p>
                        </div>

                        <button type="submit" disabled={loading}
                            className="mt-4 w-full h-11 rounded-full text-white bg-primary hover:bg-blue-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading
                                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying...</>
                                : 'Verify OTP'}
                        </button>

                        <div className="flex gap-4 mt-4 text-sm">
                            <button type="button" onClick={() => setState('forgot')}
                                className="text-gray-400 hover:text-primary transition-colors">
                                Resend OTP
                            </button>
                            <span className="text-gray-300">|</span>
                            <button type="button" onClick={() => setState('login')}
                                className="text-gray-400 hover:text-primary transition-colors">
                                Cancel
                            </button>
                        </div>
                    </form>
                )}


                {/* 
                    FORGOT PASSWORD — Step 3: Set new password
                 */}
                {state === 'reset-password' && (
                    <form onSubmit={handleResetPassword} className="w-full flex flex-col items-center">
                        <div className="w-full text-center mb-2">
                            <h1 className="text-gray-600 text-3xl font-medium">
                                <span className="text-primary">New</span> Password
                            </h1>
                            <p className="text-gray-500 text-sm mt-2">Almost done! Set your new password.</p>
                        </div>

                        <ForgotSteps current="reset-password" />

                        <div className="w-full space-y-4">

                            {/* New password */}
                            <div className="flex items-center w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden px-6 gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    type={'password'}
                                    name="newPassword"
                                    placeholder="New password (min 8 chars)"
                                    className="w-full border-none outline-none ring-0 bg-transparent"
                                    value={formData.newPassword} onChange={handleChange} required />
                            </div>

                            {/* Confirm password */}
                            <div className="flex items-center w-full bg-white border border-gray-300/80 h-12 rounded-full overflow-hidden px-6 gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    type={'password'}
                                    name="confirmPassword"
                                    placeholder="Confirm new password"
                                    className="w-full border-none outline-none ring-0 bg-transparent"
                                    value={formData.confirmPassword} onChange={handleChange} required />
                            </div>

                            {/* Live password match indicator */}
                            {formData.newPassword && formData.confirmPassword && (
                                <p className={`text-xs text-left px-3 -mt-1 ${formData.newPassword === formData.confirmPassword
                                        ? 'text-green-500' : 'text-red-400'
                                    }`}>
                                    {formData.newPassword === formData.confirmPassword
                                        ? '✓ Passwords match'
                                        : '✗ Passwords do not match'}
                                </p>
                            )}
                        </div>

                        <button type="submit" disabled={loading}
                            className="mt-6 w-full h-11 rounded-full text-white bg-primary hover:bg-blue-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading
                                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Resetting...</>
                                : 'Reset Password'}
                        </button>
                    </form>
                )}

            </div>
        </div>
    )
}

export default Login