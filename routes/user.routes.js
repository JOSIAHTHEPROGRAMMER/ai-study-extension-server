import express from 'express'
import {
    register,
    login,
    getMe,
    updatePassword,
    deleteAccount
} from '../controllers/user.controller.js'
import { protect } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimiter.js'

const userRouter = express.Router()

// Public routes
userRouter.post('/register', authLimiter, register)
userRouter.post('/login', authLimiter, login)

// Protected routes
userRouter.get('/me', protect, getMe)
userRouter.put('/password', protect, updatePassword)
userRouter.delete('/account', protect, deleteAccount)

export default userRouter