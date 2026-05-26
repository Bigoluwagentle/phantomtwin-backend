import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { connectDB } from './config/db.js'
import analysisRoutes from './routes/analysis.js'
import generateRoutes from './routes/generate.js'
import redesignRoutes from './routes/redesign.js'

// dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

connectDB()

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, please try again later.' }
})
app.use('/api', limiter)

app.use('/api/analysis', analysisRoutes)
app.use('/api/generate', generateRoutes)
app.use('/api/redesign', redesignRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'PhantomTwin backend is alive', timestamp: new Date().toISOString() })
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong on our end.' })
})

app.listen(PORT, () => {
  console.log(`PhantomTwin backend running on port ${PORT}`)
})