import mongoose from 'mongoose'

const historySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true
    },
    type: {
        type: String,
        enum: {
            values: ['explain', 'summarize', 'flashcards'],
            message: 'Type must be either explain, summarize, or flashcards'
        },
        required: [true, 'Type is required']
    },
    inputText: {
        type: String,
        required: [true, 'Input text is required'],
        maxlength: [5000, 'Input text cannot exceed 5000 characters']
    },
    result: {
        type: String,
        required: [true, 'Result is required']
    },
    url: {
        type: String,
        default: '',
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
})

// Compound index for faster queries
historySchema.index({ userId: 1, createdAt: -1 })
historySchema.index({ userId: 1, type: 1, createdAt: -1 })

// Virtual for formatted date
historySchema.virtual('formattedDate').get(function () {
    return this.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
})

// Static method to get user's history count
historySchema.statics.getUserHistoryCount = async function (userId) {
    return await this.countDocuments({ userId })
}

// Static method to get user's history by type
historySchema.statics.getUserHistoryByType = async function (userId, type) {
    return await this.find({ userId, type }).sort({ createdAt: -1 })
}

// Static method to delete old history (older than 90 days)
historySchema.statics.deleteOldHistory = async function () {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    return await this.deleteMany({ createdAt: { $lt: ninetyDaysAgo } })
}

export default mongoose.model('History', historySchema)