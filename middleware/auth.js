import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const protect = async (req, res, next) => {
    try {
        console.log('=== AUTH MIDDLEWARE ===')

        const authHeader = req.headers.authorization
        console.log('Auth header:', authHeader?.substring(0, 30) + '...')

        // Check if authorization header exists
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            console.log('❌ No token provided or invalid format')
            return res.status(401).json({
                success: false,
                error: 'Not authorized, no token'
            })
        }

        // Extract token from "Bearer TOKEN"
        const token = authHeader.split(' ')[1]

        if (!token) {
            console.log('❌ Token is empty after split')
            return res.status(401).json({
                success: false,
                error: 'Not authorized, no token'
            })
        }

        console.log('Token length:', token.length)

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        console.log('✅ Token verified')
        console.log('Decoded payload:', decoded)

        // IMPORTANT: Check which field contains the user ID
        // Common fields: userId, id, user_id, sub
        const userId = decoded.userId || decoded.id || decoded.sub

        if (!userId) {
            console.log('❌ No user ID in token payload')
            console.log('Decoded token:', decoded)
            return res.status(401).json({
                success: false,
                error: 'Invalid token payload'
            })
        }

        console.log('Looking up user ID:', userId)

        // Find user in database
        const user = await User.findById(userId)

        if (!user) {
            console.log('❌ User not found:', userId)
            return res.status(401).json({
                success: false,
                error: 'User not found'
            })
        }

        console.log('✅ User found:', user.email)
        console.log('User ID:', user.id)
        console.log('Usage:', user.apiUsage?.requestCount, '/', user.apiUsage?.dailyLimit)

        // Attach user to request
        req.user = user
        console.log('======================\n')

        next()

    } catch (error) {
        console.error('❌ Auth error:', error.message)

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            })
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired, please login again'
            })
        }

        res.status(401).json({
            success: false,
            error: 'Not authorized'
        })
    }
}