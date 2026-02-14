import jwt from 'jsonwebtoken'
import User from '../models/User.js'

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    })
}

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { email, password } = req.body

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and password'
            })
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 6 characters'
            })
        }

        // Check if user exists
        const userExists = await User.findOne({ email })
        if (userExists) {
            return res.status(400).json({
                success: false,
                error: 'User already exists with this email'
            })
        }

        // Create user
        const user = await User.create({
            email,
            password
        })

        // Generate token
        const token = generateToken(user._id)

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                email: user.email,
                apiUsage: {
                    used: user.apiUsage.requestCount,
                    limit: user.apiUsage.dailyLimit,
                    remaining: user.getRemainingUsage()
                },
                createdAt: user.createdAt
            }
        })
    } catch (error) {
        console.error('Register error:', error)
        res.status(500).json({
            success: false,
            error: 'Server error during registration'
        })
    }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide email and password'
            })
        }

        // Find user
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            })
        }

        // Check password
        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            })
        }

        // Generate token
        const token = generateToken(user._id)

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                apiUsage: {
                    used: user.apiUsage.requestCount,
                    limit: user.apiUsage.dailyLimit,
                    remaining: user.getRemainingUsage()
                },
                createdAt: user.createdAt
            }
        })
    } catch (error) {
        console.error('Login error:', error)
        res.status(500).json({
            success: false,
            error: 'Server error during login'
        })
    }
}

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            })
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                apiUsage: {
                    used: user.apiUsage.requestCount,
                    limit: user.apiUsage.dailyLimit,
                    remaining: user.getRemainingUsage(),
                    lastReset: user.apiUsage.lastReset
                },
                createdAt: user.createdAt
            }
        })
    } catch (error) {
        console.error('Get me error:', error)
        res.status(500).json({
            success: false,
            error: 'Server error'
        })
    }
}

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Please provide current and new password'
            })
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 6 characters'
            })
        }

        const user = await User.findById(req.user.id)

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword)
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            })
        }

        // Update password
        user.password = newPassword
        await user.save()

        res.json({
            success: true,
            message: 'Password updated successfully'
        })
    } catch (error) {
        console.error('Update password error:', error)
        res.status(500).json({
            success: false,
            error: 'Server error'
        })
    }
}

// @desc    Delete user account
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body

        if (!password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide your password to confirm deletion'
            })
        }

        const user = await User.findById(req.user.id)

        // Verify password
        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Password is incorrect'
            })
        }

        // Delete user 
        await user.deleteOne()

        res.json({
            success: true,
            message: 'Account deleted successfully'
        })
    } catch (error) {
        console.error('Delete account error:', error)
        res.status(500).json({
            success: false,
            error: 'Server error'
        })
    }
}