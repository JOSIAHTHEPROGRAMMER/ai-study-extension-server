import express from 'express'
import {
    makeGroqRequest,
    getUsageStats,
    resetUsage
} from '../controllers/groq.controller.js'
import { protect } from '../middleware/auth.js'
import { groqLimiter } from '../middleware/rateLimiter.js'

const groqRouter = express.Router()

// All routes are protected
groqRouter.post('/request', protect, groqLimiter, makeGroqRequest)
groqRouter.get('/usage', protect, getUsageStats)
groqRouter.post('/reset', protect, resetUsage)

export default groqRouter