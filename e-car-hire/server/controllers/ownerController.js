import User from "../models/User.js";
import Car from "../models/Car.js";
import crypto from 'crypto'
import Booking from "../models/Booking.js";
import Escrow from '../models/Escrow.js'
import { uploadToCloudinary } from '../configs/cloudinary.js'  // ✅ replaces imagekit
import { sendBookingConfirmationEmail, sendOwnerNotificationEmail } from '../utils/Emailservice.js'
import { createEscrow } from './escrowController.js'

// ❌ REMOVED: import ImageKit from "imagekit"
// ❌ REMOVED: import imagekit from "../configs/imageKit.js"
// ❌ REMOVED: import fs from "fs"

export const changeRoleToOwner = async (req, res) => {
  try {
    const { _id } = req.user
    await User.findByIdAndUpdate(_id, {
      'ownerVerification.status': 'not_submitted',
    })
    return res.json({ success: true, message: 'Please complete your verification to list cars.' })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

export const addCar = async (req, res) => {
  try {
    const { _id } = req.user

    const owner = await User.findById(_id).select('ownerVerification role')
    if (owner?.ownerVerification?.status !== 'verified') {
      return res.json({
        success: false,
        message: 'Your account must be verified by admin before listing cars.'
      })
    }

    let car = JSON.parse(req.body.carData)

    // ✅ Upload to Cloudinary using buffer (no disk read needed)
    const result = await uploadToCloudinary(req.file.buffer)
    const imageUrl = result.secure_url

    await Car.create({
      ...car,
      owner: _id,
      images: [imageUrl],
      isAvailable: false,
      isVerified: 'pending'
    })

    return res.json({ success: true, message: 'Car submitted for admin review. It will be listed after approval.' })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

export const getOwnerCars = async (req, res) => {
  try {
    const { _id } = req.user;
    const cars = await Car.find({ owner: _id });
    return res.json({ success: true, cars })
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message })
  }
}

export const toggleCarAvailability = async (req, res) => {
  try {
    const { _id } = req.user
    const { carId } = req.body
    const car = await Car.findById(carId)

    if (car.owner.toString() !== _id.toString()) {
      return res.json({ success: false, message: 'Unauthorized' })
    }
    if (car.isVerified !== 'verified') {
      return res.json({ success: false, message: 'Car must be verified by admin before toggling availability.' })
    }

    car.isAvailable = !car.isAvailable
    await car.save()
    return res.json({ success: true, message: 'Availability Toggled!' })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

export const deleteCar = async (req, res) => {
  try {
    const { _id } = req.user;
    const { carId } = req.body;
    const car = await Car.findById(carId)

    if (car.owner.toString() !== _id.toString()) {
      return res.json({ success: false, message: "Unauthorized" })
    }

    car.owner = null;
    car.isAvailable = false;
    await car.save()
    return res.json({ success: true, message: "Car Removed" })
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message })
  }
}

export const getDashboardData = async (req, res) => {
  try {
    const { _id, role } = req.user;
    if (role !== 'owner') {
      return res.json({ success: false, message: "Unauthorized" })
    }

    const cars = await Car.find({ owner: _id });
    const bookings = await Booking.find({ owner: _id }).populate('car').sort({ createdAt: -1 })
    const pendingBookings = bookings.filter(b => b.status === 'pending')
    const completedBookings = bookings.filter(b => b.status === 'confirmed')

    const now = new Date()
    const monthlyRevenue = bookings
      .filter(b =>
        b.status === 'confirmed' &&
        b.paymentStatus === 'paid' &&
        new Date(b.createdAt).getMonth() === now.getMonth() &&
        new Date(b.createdAt).getFullYear() === now.getFullYear()
      )
      .reduce((acc, b) => acc + b.price, 0)

    return res.json({
      success: true,
      dashboardData: {
        totalCars: cars.length,
        totalBookings: bookings.length,
        pendingBookings: pendingBookings.length,
        completedBookings: completedBookings.length,
        recentBookings: bookings.slice(0, 3),
        monthlyRevenue
      }
    })
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message })
  }
}

export const getOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.user._id
    const cars = await Car.find({ owner: ownerId })
    const bookings = await Booking.find({ owner: ownerId })
      .populate('car')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })

    const totalBookings = bookings.length
    const pendingBookings = bookings.filter(b => b.status === 'pending').length
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
    const completedBookings = bookings.filter(b => b.status === 'completed').length

    let availableBalance = 0, pendingBalance = 0, totalEarnings = 0

    bookings.forEach(b => {
      if (b.paymentStatus === 'paid') {
        if (b.otpVerified) {
          availableBalance += b.price
          totalEarnings += b.price
        } else if (b.status === 'confirmed' || b.status === 'active') {
          pendingBalance += b.price
        }
      }
    })

    const now = new Date()
    const monthlyRevenue = bookings
      .filter(b => {
        const d = new Date(b.createdAt)
        return d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear() &&
          b.otpVerified && b.paymentStatus === 'paid'
      })
      .reduce((sum, b) => sum + b.price, 0)

    const recentBookings = bookings.slice(0, 5).map(b => ({
      _id: b._id,
      car: { brand: b.car?.brand, model: b.car?.model, image: b.car?.image },
      user: b.user,
      price: b.price,
      status: b.status,
      otpVerified: b.otpVerified,
      paymentStatus: b.paymentStatus,
      createdAt: b.createdAt,
      pickupDate: b.pickupDate,
    }))

    return res.json({
      success: true,
      dashboardData: {
        totalCars: cars.length,
        totalBookings,
        pendingBookings: pendingBookings + confirmedBookings,
        completedBookings,
        recentBookings,
        monthlyRevenue,
        availableBalance,
        pendingBalance,
        escrowBalance: pendingBalance,
        totalEarnings,
      }
    })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

export const updateUserImage = async (req, res) => {
  try {
    const { _id } = req.user;

    // ✅ Upload to Cloudinary using buffer
    const result = await uploadToCloudinary(req.file.buffer)
    const image = result.secure_url

    await User.findByIdAndUpdate(_id, { image })
    return res.json({ success: true, message: "Image Updated", image })
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message })
  }
}

export const verifyPickupOtp = async (req, res) => {
  try {
    const { bookingId, otp } = req.body
    const ownerId = req.user._id

    const booking = await Booking.findById(bookingId)
    if (!booking) return res.json({ success: false, message: 'Booking not found' })
    if (booking.owner.toString() !== ownerId.toString()) return res.json({ success: false, message: 'Unauthorized' })
    if (booking.otpVerified) return res.json({ success: false, message: 'OTP already used — car already handed over' })
    if (booking.pickupOtp !== otp) return res.json({ success: false, message: 'Invalid OTP. Please ask the renter to check their email.' })

    await Booking.findByIdAndUpdate(bookingId, {
      otpVerified: true,
      otpVerifiedAt: new Date(),
      status: 'completed',
    })

    const escrow = await Escrow.findOne({ booking: bookingId, status: 'held' })
    if (escrow) {
      await Escrow.findByIdAndUpdate(escrow._id, {
        status: 'released',
        releasedAt: new Date(),
        notes: 'Released after OTP verified at pickup'
      })
    }

    return res.json({
      success: true,
      message: `OTP verified! Car handed over successfully. ₹${
        escrow?.amount?.toLocaleString('en-IN') || booking.price.toLocaleString('en-IN')
      } will be credited to your bank account within 2-3 business days.`
    })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    const sign = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
      .update(sign)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.json({ success: false, message: 'Invalid payment signature' })
    }

    const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString()
    const booking = await Booking.findOneAndUpdate(
      { orderId: razorpay_order_id },
      { paymentStatus: 'paid', status: 'confirmed', paymentId: razorpay_payment_id, pickupOtp },
      { new: true }
    ).populate('car').populate('user', '-password')

    if (!booking) return res.json({ success: false, message: 'Booking not found' })

    await createEscrow(booking, razorpay_payment_id)

    await sendBookingConfirmationEmail(booking.user.email, {
      userName: booking.user.name,
      carName: `${booking.car.brand} ${booking.car.model}`,
      pickupDate: new Date(booking.pickupDate).toDateString(),
      returnDate: new Date(booking.returnDate).toDateString(),
      totalPrice: booking.price,
      bookingId: booking._id,
      pickupOtp,
    })

    const ownerUser = await User.findById(booking.owner).select('name email')
    if (ownerUser) {
      await sendOwnerNotificationEmail(ownerUser.email, {
        ownerName: ownerUser.name || 'Owner',
        carName: `${booking.car.brand} ${booking.car.model}`,
        renterName: booking.user.name,
        renterEmail: booking.user.email,
        renterPhone: booking.user.phone || 'Not provided',
        renterLicence: booking.user.licenceNumber || 'Not provided',
        renterAddress: booking.user.address || 'Not provided',
        pickupLocation: booking.pickupLocation || booking.car.location,
        carLocation: booking.car.location,
        pickupDate: new Date(booking.pickupDate).toDateString(),
        returnDate: new Date(booking.returnDate).toDateString(),
        totalPrice: booking.price,
        bookingId: booking._id,
        pickupOtp,
      })
    }

    return res.json({ success: true, message: 'Payment verified successfully' })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

export const submitVerification = async (req, res) => {
  try {
    const { _id } = req.user
    const { aadharNumber, panNumber, bankAccount, ifscCode, upiId } = req.body

    // ✅ Upload each doc to Cloudinary using buffer — no fs.readFileSync needed
    const uploadDoc = async (file) => {
      if (!file) return ''
      const result = await uploadToCloudinary(file.buffer)
      return result.secure_url
    }

    const aadharDocUrl = await uploadDoc(req.files?.aadharDoc?.[0])
    const rcBookUrl    = await uploadDoc(req.files?.rcBook?.[0])
    const selfieUrl    = await uploadDoc(req.files?.selfie?.[0])

    await User.findByIdAndUpdate(_id, {
      aadharNumber, panNumber, bankAccount, ifscCode, upiId,
      'ownerVerification.status':       'pending',
      'ownerVerification.submittedAt':  new Date(),
      'ownerVerification.aadharNumber': aadharNumber,
      ...(aadharDocUrl && { 'ownerVerification.aadharImage': aadharDocUrl }),
      ...(rcBookUrl    && { 'ownerVerification.rcImage':     rcBookUrl }),
      ...(selfieUrl    && { 'ownerVerification.selfieImage': selfieUrl }),
    })

    return res.json({
      success: true,
      message: 'Verification submitted! We will review your documents within 24 hours.'
    })
  } catch (error) {
    console.log(error.message)
    return res.json({ success: false, message: error.message })
  }
}

export const ownerProfile = async (req, res) => {
  try {
    const { name, phone } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true }
    ).select('-password')
    res.json({ success: true, user })
  } catch (error) {
    console.log(error.message)
    res.json({ success: false, message: error.message })
  }
}