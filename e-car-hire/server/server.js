import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/db.js'
import userRouter from './routes/userRoutes.js'
import ownerRouter from './routes/ownerRoutes.js'
import bookingRouter from './routes/bookingRoutes.js'
import escrowRouter from './routes/escrowRoutes.js'
import adminRouter from './routes/adminRoutes.js'

const app = express()

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://car-rento-client.vercel.app',
    'https://car-rento-admin.vercel.app',
  ],
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

connectDB()

app.get('/', (req, res) => {
  res.json({ success: true, message: 'CarRento API is running 🚀' })
})

app.use('/api/user',     userRouter)
app.use('/api/owner',    ownerRouter)
app.use('/api/bookings', bookingRouter)
app.use('/api/admin',    adminRouter)
app.use('/api/escrow',   escrowRouter)

const PORT = process.env.PORT || 3000
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`CarRento Server running on port ${PORT}`))
}

export default app