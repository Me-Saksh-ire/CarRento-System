import User from '../models/User.js'
import { uploadToCloudinary } from '../configs/cloudinary.js' 

// Submit documents
export const submitVerification = async (req, res) => {
  try {
    const { aadharNumber, vehicleRegNo } = req.body
    const files = req.files

    if (!files?.aadharImage || !files?.rcImage || !files?.selfieImage) {
      return res.json({ success: false, message: 'Please upload all 3 documents' })
    }

    if (!aadharNumber || !vehicleRegNo) {
      return res.json({ success: false, message: 'Please fill all document numbers' })
    }

    // ✅ Upload to Cloudinary using buffer — no fs.readFileSync needed
    const [aadharUrl, rcUrl, selfieUrl] = await Promise.all([
      uploadToCloudinary(files.aadharImage[0].buffer).then(r => r.secure_url),
      uploadToCloudinary(files.rcImage[0].buffer).then(r => r.secure_url),
      uploadToCloudinary(files.selfieImage[0].buffer).then(r => r.secure_url),
    ])

    await User.findByIdAndUpdate(req.user._id, {
      'ownerVerification.status':       'pending',
      'ownerVerification.aadharImage':  aadharUrl,
      'ownerVerification.rcImage':      rcUrl,
      'ownerVerification.selfieImage':  selfieUrl,
      'ownerVerification.aadharNumber': aadharNumber,
      'ownerVerification.vehicleRegNo': vehicleRegNo,
      'ownerVerification.submittedAt':  new Date()
    })

    res.json({ success: true, message: 'Documents submitted for verification' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Get pending verifications (Admin only)
export const getPendingVerifications = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const users = await User.find({ 'ownerVerification.status': 'pending' }).select('-password')
    res.json({ success: true, users })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Approve (Admin only)
export const approveVerification = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const { userId } = req.body
    await User.findByIdAndUpdate(userId, {
      role: 'owner',
      'ownerVerification.status':     'verified',
      'ownerVerification.verifiedAt': new Date()
    })

    res.json({ success: true, message: 'Owner verified successfully' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Reject (Admin only)
export const rejectVerification = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.json({ success: false, message: 'Unauthorized' })
    }

    const { userId, reason } = req.body
    await User.findByIdAndUpdate(userId, {
      'ownerVerification.status':       'rejected',
      'ownerVerification.rejectedAt':   new Date(),
      'ownerVerification.rejectReason': reason || 'Documents unclear'
    })

    res.json({ success: true, message: 'Verification rejected' })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Get status
export const getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('ownerVerification role')
    res.json({ success: true, status: user.ownerVerification.status, role: user.role })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}