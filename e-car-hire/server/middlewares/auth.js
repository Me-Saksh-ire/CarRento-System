import jwt from "jsonwebtoken";
import User from '../models/User.js'

export const protect = async (req, res, next) => {
  let token = req.headers.authorization

  if (token && token.startsWith('Bearer ')) {
    token = token.split(' ')[1]
  }

  if (!token) return res.json({ success: false, message: 'Not authorized' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (decoded.role === 'admin') {
      req.user = { email: decoded.email, role: 'admin' }
      return next()
    }

    const userId = decoded.id
    if (!userId) return res.json({ success: false, message: 'Not authorized' })

    const user = await User.findById(userId).select('-password')
    if (!user) return res.json({ success: false, message: 'User not found' })

    if (user.isBlocked) {
      return res.json({ success: false, message: 'Your account has been blocked. Please contact support.' })
    }

    req.user = user
    next()
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}