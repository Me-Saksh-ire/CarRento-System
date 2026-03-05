import User from '../models/User.js'
import Car from '../models/Car.js'
import Booking from '../models/Booking.js'
import Dispute from '../models/Dispute.js'
import jwt from 'jsonwebtoken'

const requireAdmin = (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    res.json({ success: false, message: 'Unauthorized — admin only' })
    return false
  }
  return true
}

// ── AUTH ──────────────────────────────────────────────────────────────────────

// POST /api/admin/login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.json({ success: false, message: 'Email and password required' })

    if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASS)
      return res.json({ success: false, message: 'Invalid credentials' })

    const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' })

    return res.json({
      success: true,
      token,
      admin: { name: 'CarRento Admin', email, role: 'admin' },
    })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

// GET /api/admin/dashboard
export const getAdminDashboard = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return

    const [
      totalUsers,
      totalOwners,
      totalCars,
      totalBookings,
      pendingOwnerVerifications,
      pendingCarVerifications,
      pendingRenterVerifications,
      openDisputes,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'owner' }),
      Car.countDocuments(),
      Booking.countDocuments(),
      User.countDocuments({ 'ownerVerification.status': 'pending' }),
      Car.countDocuments({ isVerified: 'pending' }),
      // ✅ Count anyone with pending renterVerification (regardless of role)
      User.countDocuments({ 'renterVerification.status': 'pending' }),
      Dispute.countDocuments({ status: 'open' }),
    ])

    const recentBookings = await Booking.find()
      .populate('car', 'brand model images')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalOwners,
        totalCars,
        totalBookings,
        pendingOwnerVerifications,
        pendingCarVerifications,
        pendingRenterVerifications,
        openDisputes,
      },
      recentBookings,
    })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// ── USER / RENTER VERIFICATION ────────────────────────────────────────────────

// GET /api/admin/users?status=pending|verified|rejected|all
export const getAllUsers = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return

    const { status } = req.query

    // ✅ KEY FIX: Do NOT filter by role — a user who became an owner
    // still has renterVerification data we need to show.
    // Filter ONLY by renterVerification.status (or show all who submitted)
    const filter = {}

    if (status && status !== 'all') {
      // Specific tab: pending / verified / rejected
      filter['renterVerification.status'] = status
    } else {
      // "All" tab: show everyone who has a renterVerification status set
      // (not just 'not_submitted' / missing)
      filter['renterVerification.status'] = {
        $in: ['pending', 'verified', 'rejected'],
      }
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ 'renterVerification.submittedAt': -1, createdAt: -1 })

    return res.json({ success: true, users })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// POST /api/admin/users/verify-renter   { userId, action: 'approve'|'reject', reason? }
export const verifyRenter = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return

    const { userId, action, reason } = req.body
    if (!userId || !action)
      return res.json({ success: false, message: 'userId and action required' })

    const update =
      action === 'approve'
        ? {
            'renterVerification.status': 'verified',
            'renterVerification.reviewedAt': new Date(),
            'renterVerification.rejectReason': null,
          }
        : {
            'renterVerification.status': 'rejected',
            'renterVerification.reviewedAt': new Date(),
            'renterVerification.rejectReason':
              reason || 'Documents could not be verified. Please resubmit.',
          }

    await User.findByIdAndUpdate(userId, { $set: update })

    return res.json({
      success: true,
      message:
        action === 'approve'
          ? 'User verified successfully'
          : 'User verification rejected',
    })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// ── OWNER VERIFICATION ────────────────────────────────────────────────────────

// GET /api/admin/owners/pending
export const getPendingOwners = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return

    const owners = await User.find({ 'ownerVerification.status': 'pending' })
      .select('-password')
      .sort({ 'ownerVerification.submittedAt': 1 })

    return res.json({ success: true, owners })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// GET /api/admin/owners/all
export const getAllOwners = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return

    const { status } = req.query
    const filter = {
      'ownerVerification.status': { $exists: true, $ne: null },
    }
    if (status) filter['ownerVerification.status'] = status

    const owners = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })

    return res.json({ success: true, owners })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// POST /api/admin/owners/approve   { userId }
export const approveOwner = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return

    const { userId } = req.body
    if (!userId) return res.json({ success: false, message: 'userId required' })

    await User.findByIdAndUpdate(userId, {
      role: 'owner',
      'ownerVerification.status': 'verified',
      'ownerVerification.reviewedAt': new Date(),
      'ownerVerification.rejectReason': null,
    })

    return res.json({ success: true, message: 'Owner verified and approved successfully' })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// POST /api/admin/owners/reject   { userId, reason }
export const rejectOwner = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return

    const { userId, reason } = req.body
    if (!userId) return res.json({ success: false, message: 'userId required' })

    await User.findByIdAndUpdate(userId, {
      'ownerVerification.status': 'rejected',
      'ownerVerification.reviewedAt': new Date(),
      'ownerVerification.rejectReason':
        reason || 'Documents could not be verified. Please resubmit.',
    })

    return res.json({ success: true, message: 'Owner verification rejected' })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// ── CAR VERIFICATION ──────────────────────────────────────────────────────────

// GET /api/admin/cars?status=pending|verified|rejected
export const getAllCars = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return

    const { status } = req.query
    const filter = {}

    if (status === 'pending') filter.isVerified = { $in: [null, undefined, 'pending'] }
    else if (status) filter.isVerified = status

    // Populate owner with verification documents and profile licence number
    const cars = await Car.find(filter)
      .populate('owner', 'name email image licenceNumber ownerVerification')
      .sort({ createdAt: -1 })

    return res.json({ success: true, cars })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// POST /api/admin/cars/approve   { carId }
export const approveCar = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return

    const { carId } = req.body
    if (!carId) return res.json({ success: false, message: 'carId required' })

    await Car.findByIdAndUpdate(carId, {
      isVerified: 'verified',
      isAvailable: true,
      verifiedAt: new Date(),
      rejectReason: null,
    })

    return res.json({ success: true, message: 'Car approved and listed on the platform' })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// POST /api/admin/cars/reject   { carId, reason }
export const rejectCar = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return

    const { carId, reason } = req.body
    if (!carId) return res.json({ success: false, message: 'carId required' })

    await Car.findByIdAndUpdate(carId, {
      isVerified: 'rejected',
      isAvailable: false,
      rejectReason: reason || 'Car listing does not meet our requirements.',
    })

    return res.json({ success: true, message: 'Car listing rejected' })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// ── DISPUTES ──────────────────────────────────────────────────────────────────

// GET /api/admin/disputes
export const getDisputes = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return

    const disputes = await Dispute.find()
      .populate({
        path: 'booking',
        populate: [{ path: 'car' }, { path: 'user', select: '-password' }],
      })
      .populate('raisedBy', 'name email')
      .sort({ createdAt: -1 })

    return res.json({ success: true, disputes })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}