// admin/src/context/AdminContext.jsx
import { createContext, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export const AdminContext = createContext()

const backendUrl = import.meta.env.VITE_BACKEND_URL

export const AdminProvider = ({ children }) => {
  const [aToken, setAToken] = useState(localStorage.getItem('aToken') || '')

  // ─── Auth ────────────────────────────────────────────────────────────────
  const adminLogin = async (email, password) => {
    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/login`, { email, password })
      if (data.success) {
        localStorage.setItem('aToken', data.token)
        setAToken(data.token)
        toast.success('Welcome back, Admin!')
        return true
      }
      toast.error(data.message)
      return false
    } catch (e) {
      toast.error(e.message)
      return false
    }
  }

  const adminLogout = () => {
    localStorage.removeItem('aToken')
    setAToken('')
    toast.success('Logged out successfully')
  }

  // ─── Axios instance ───────────────────────────────────────────────────────
  // middleware reads req.headers.authorization RAW (no "Bearer " prefix),
  // so we send the token directly without any prefix.
  const api = axios.create({ baseURL: backendUrl })
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('aToken')
    if (token) config.headers['authorization'] = token
    return config
  })

  const value = {
    aToken,
    setAToken,
    backendUrl,
    api,
    adminLogin,
    adminLogout,
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}