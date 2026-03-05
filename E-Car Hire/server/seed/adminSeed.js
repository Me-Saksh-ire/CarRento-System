// server/seed/adminSeed.js
// Run once to create the admin account:
//   node server/seed/adminSeed.js


import mongoose from 'mongoose'
import bcrypt   from 'bcrypt'
import User     from '../models/User.js'
import 'dotenv/config'

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const existing = await User.findOne({ email: 'admin@carrento.com' })
    if (existing) {
      console.log('⚠️  Admin already exists — aborting.')
      process.exit(0)
    }

    const hashedPassword = await bcrypt.hash('Admin@123', 10)

    await User.create({
      name:     'CarRento Admin',
      email:    'admin@carrento.com',
      password: hashedPassword,
      role:     'admin',
      image:    '',
    })

    console.log('🎉 Admin account created!')
    console.log('   Email   : admin@carrento.com')
    console.log('   Password: Admin@123')
    console.log('   ⚠️  Change the password after first login.')
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

run()
