import React from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import MyBookings from './pages/MyBookings'
import Cars from './pages/Cars'
import CarDetails from './pages/CarDetails'
import Footer from './components/Footer'
import Login from './components/Login'
import UserProfile from './pages/UserProfile'
import Dashboard from './pages/owner/Dashboard'
import Layout from './pages/owner/Layout'
import ManageCars from './pages/owner/ManageCars'
import ManageBooking from './pages/owner/ManageBooking'
import AddCars from './pages/owner/AddCars'
import OwnerVerification from './pages/owner/OwnerVerification'
import OwnerProfile from './pages/owner/Ownerprofile'
import { Toaster } from 'react-hot-toast'
import { useAppContext } from './context/AppContext'

// ✅ No admin imports — admin panel fully removed

function App() {
  const { showLogin } = useAppContext()
  const pathname = useLocation().pathname
  const isOwnerPath = pathname.startsWith('/owner')

  return (
    <>
      <Toaster />
      {showLogin && <Login />}
      {!isOwnerPath && <Navbar />}
      <Routes>

        {/* ── Public ── */}
        <Route path='/' element={<Home />} />
        <Route path='/car-details/:id' element={<CarDetails />} />
        <Route path='/cars' element={<Cars />} />
        <Route path='/my-bookings' element={<MyBookings />} />
        <Route path='/user-profile' element={<UserProfile />} />

        {/* ── Owner panel ── */}
        <Route path='/owner' element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path='add-car' element={<AddCars />} />
          <Route path='manage-cars' element={<ManageCars />} />
          <Route path='manage-bookings' element={<ManageBooking />} />
          <Route path='verification' element={<OwnerVerification />} />
          <Route path='profile' element={<OwnerProfile />} />
        </Route>

      </Routes>
      {!isOwnerPath && <Footer />}
    </>
  )
}

export default App