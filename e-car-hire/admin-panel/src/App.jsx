// admin/src/App.jsx
import { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AdminContext } from './context/AdminContext'

import AdminLogin               from './pages/AdminLogin'
import AdminNavbar              from './components/AdminNavbar'
import Sidebar                  from './components/Sidebar'
import AdminDashboard           from './pages/AdminDashboard'
import AdminOwnerVerifications  from './pages/AdminOwnerVerifications'
import AdminRenterVerifications from './pages/AdminRenterVerifications'
import AdminCarVerifications    from './pages/AdminCarVerifications'

const App = () => {
  const { aToken } = useContext(AdminContext)

  if (!aToken) {
    return (
      <>
        <Toaster position="top-center" />
        <AdminLogin />
      </>
    )
  }

  return (
    <div className="bg-[#F8F9FD] min-h-screen">
      <Toaster position="top-center" />
      <AdminNavbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/admin-dashboard"  element={<AdminDashboard />} />
            <Route path="/verify-owners"    element={<AdminOwnerVerifications />} />
            <Route path="/verify-renters"   element={<AdminRenterVerifications />} />
            <Route path="/verify-cars"      element={<AdminCarVerifications />} />
            <Route path="*"                 element={<Navigate to="/admin-dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App