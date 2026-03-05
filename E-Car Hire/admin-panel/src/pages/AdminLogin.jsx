// admin/src/pages/AdminLogin.jsx
import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminContext } from '../context/AdminContext'

const AdminLogin = () => {
  const { adminLogin } = useContext(AdminContext)
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const ok = await adminLogin(email, password)
    setLoading(false)
    if (ok) navigate('/admin-dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FD]">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-10">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-2xl font-semibold">
            <span className="text-[#5f6FFF]">Admin</span> Login
          </p>
          <p className="text-gray-400 text-sm mt-1">Authorized personnel only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              placeholder="example@admin.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#5f6FFF] transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#5f6FFF] transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5f6FFF] hover:bg-[#4a5ae8] text-white font-medium py-3 rounded-lg text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging in...
              </>
            ) : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin