import User from '../models/User.js'
import imagekit from '../configs/imageKit.js'
import fs from 'fs'

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
    
    // Upload to ImageKit
    const uploadToImageKit = async (file, folder) => {
      const buffer = fs.readFileSync(file.path)
      const response = await imagekit.upload({
        file: buffer,
        fileName: file.originalname,
        folder: `/owner-verification/${folder}`
      })
      return imagekit.url({
        path: response.filePath,
        transformation: [{ quality: 'auto' }, { format: 'webp' }]
      })
    }
    
    const [aadharUrl, rcUrl, selfieUrl] = await Promise.all([
      uploadToImageKit(files.aadharImage[0], 'aadhar'),
      uploadToImageKit(files.rcImage[0], 'rc'),
      uploadToImageKit(files.selfieImage[0], 'selfie')
    ])
    
    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      'ownerVerification.status': 'pending',
      'ownerVerification.aadharImage': aadharUrl,
      'ownerVerification.rcImage': rcUrl,
      'ownerVerification.selfieImage': selfieUrl,
      'ownerVerification.aadharNumber': aadharNumber,
      'ownerVerification.vehicleRegNo': vehicleRegNo,
      'ownerVerification.submittedAt': new Date()
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
      'ownerVerification.status': 'verified',
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
      'ownerVerification.status': 'rejected',
      'ownerVerification.rejectedAt': new Date(),
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