import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    apiUsage: {
        requestCount: {
            type: Number,
            default: 0
        },
        lastReset: {
            type: Date,
            default: Date.now
        },
        dailyLimit: {
            type: Number,
            default: 100
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next()
    }

    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
}

// Check and reset daily usage
userSchema.methods.checkDailyLimit = function () {
    const now = new Date()
    const lastReset = new Date(this.apiUsage.lastReset)
    const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60)

    // Reset if 24 hours passed
    if (hoursSinceReset >= 24) {
        this.apiUsage.requestCount = 0
        this.apiUsage.lastReset = now
    }

    return this.apiUsage.requestCount < this.apiUsage.dailyLimit
}

// Increment usage counter
userSchema.methods.incrementUsage = async function () {
    this.apiUsage.requestCount += 1
    await this.save()
}

// Get remaining usage
userSchema.methods.getRemainingUsage = function () {
    return this.apiUsage.dailyLimit - this.apiUsage.requestCount
}

export default mongoose.model('User', userSchema)