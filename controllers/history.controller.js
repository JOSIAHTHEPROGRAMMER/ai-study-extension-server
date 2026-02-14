import History from '../models/History.js'

// @desc    Save study result to history
// @route   POST /api/history
// @access  Private
export const saveHistory = async (req, res) => {
    try {
        const { type, inputText, result, url } = req.body

        // Validation
        if (!type || !inputText || !result) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: type, inputText, result'
            })
        }

        if (!['explain', 'summarize', 'flashcards'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid type. Must be: explain, summarize, or flashcards'
            })
        }

        // Create history entry
        const history = await History.create({
            userId: req.user.id,
            type,
            inputText,
            result,
            url: url || ''
        })

        res.status(201).json({
            success: true,
            message: 'History saved successfully',
            history: {
                id: history._id,
                type: history.type,
                inputText: history.inputText,
                result: history.result,
                url: history.url,
                createdAt: history.createdAt
            }
        })
    } catch (error) {
        console.error('Save history error:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to save history'
        })
    }
}

// @desc    Get user's study history
// @route   GET /api/history
// @access  Private
export const getHistory = async (req, res) => {
    try {
        const { type, limit = 100, skip = 0, search } = req.query

        // Build query
        const query = { userId: req.user.id }

        if (type && ['explain', 'summarize', 'flashcards'].includes(type)) {
            query.type = type
        }

        if (search) {
            query.$or = [
                { inputText: { $regex: search, $options: 'i' } },
                { result: { $regex: search, $options: 'i' } }
            ]
        }

        // Get history with pagination
        const history = await History.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip))

        const total = await History.countDocuments(query)

        res.json({
            success: true,
            count: history.length,
            history: history.map(item => ({
                id: item._id,
                type: item.type,
                inputText: item.inputText,
                result: item.result,
                url: item.url,
                createdAt: item.createdAt
            })),
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip),
                hasMore: total > parseInt(skip) + parseInt(limit),
                page: Math.floor(parseInt(skip) / parseInt(limit)) + 1,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        })
    } catch (error) {
        console.error('Get history error:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to get history'
        })
    }
}

// @desc    Get single history item
// @route   GET /api/history/:id
// @access  Private
export const getHistoryById = async (req, res) => {
    try {
        const { id } = req.params

        const history = await History.findOne({
            _id: id,
            userId: req.user.id
        })

        if (!history) {
            return res.status(404).json({
                success: false,
                error: 'History item not found'
            })
        }

        res.json({
            success: true,
            history: {
                id: history._id,
                type: history.type,
                inputText: history.inputText,
                result: history.result,
                url: history.url,
                createdAt: history.createdAt
            }
        })
    } catch (error) {
        console.error('Get history by ID error:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to get history item'
        })
    }
}

// @desc    Delete history item
// @route   DELETE /api/history/:id
// @access  Private
export const deleteHistory = async (req, res) => {
    try {
        const { id } = req.params

        const history = await History.findOne({
            _id: id,
            userId: req.user.id
        })

        if (!history) {
            return res.status(404).json({
                success: false,
                error: 'History item not found'
            })
        }

        await history.deleteOne()

        res.json({
            success: true,
            message: 'History item deleted successfully'
        })
    } catch (error) {
        console.error('Delete history error:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to delete history'
        })
    }
}

// @desc    Clear all history
// @route   DELETE /api/history/clear
// @access  Private
export const clearHistory = async (req, res) => {
    try {
        const result = await History.deleteMany({ userId: req.user.id })

        res.json({
            success: true,
            message: `All history cleared. ${result.deletedCount} items deleted.`,
            deletedCount: result.deletedCount
        })
    } catch (error) {
        console.error('Clear history error:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to clear history'
        })
    }
}

// @desc    Get history statistics
// @route   GET /api/history/stats
// @access  Private
export const getHistoryStats = async (req, res) => {
    try {
        // Aggregate statistics by type
        const stats = await History.aggregate([
            { $match: { userId: req.user.id } },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ])

        const total = await History.countDocuments({ userId: req.user.id })

        // Format stats
        const formattedStats = {
            total,
            explain: 0,
            summarize: 0,
            flashcards: 0
        }

        stats.forEach(stat => {
            formattedStats[stat._id] = stat.count
        })

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const recentCount = await History.countDocuments({
            userId: req.user.id,
            createdAt: { $gte: sevenDaysAgo }
        })

        res.json({
            success: true,
            stats: {
                ...formattedStats,
                recentActivity: {
                    last7Days: recentCount
                }
            }
        })
    } catch (error) {
        console.error('Get history stats error:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to get stats'
        })
    }
}

// @desc    Delete old history (cleanup)
// @route   DELETE /api/history/cleanup
// @access  Private
export const cleanupOldHistory = async (req, res) => {
    try {
        const { days = 90 } = req.query

        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days))

        const result = await History.deleteMany({
            userId: req.user.id,
            createdAt: { $lt: cutoffDate }
        })

        res.json({
            success: true,
            message: `Deleted history older than ${days} days`,
            deletedCount: result.deletedCount
        })
    } catch (error) {
        console.error('Cleanup history error:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to cleanup history'
        })
    }
}