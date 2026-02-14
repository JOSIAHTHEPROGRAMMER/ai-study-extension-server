import User from '../models/User.js'
import ai from '../configs/openai.js'

// @desc    Make Groq API request
// @route   POST /api/groq/request
// @access  Private
export const makeGroqRequest = async (req, res) => {
    try {
        const { systemPrompt, userText } = req.body

        // Validation
        if (!systemPrompt || !userText) {
            return res.status(400).json({
                success: false,
                error: 'Missing systemPrompt or userText'
            })
        }

        if (userText.length > 5000) {
            return res.status(400).json({
                success: false,
                error: 'Input text cannot exceed 5000 characters'
            })
        }

        // Get user and check daily limit
        const user = await User.findById(req.user.id)

        if (!user.checkDailyLimit()) {
            const hoursUntilReset = 24 - ((new Date() - new Date(user.apiUsage.lastReset)) / (1000 * 60 * 60))

            return res.status(429).json({
                success: false,
                error: 'Daily API limit reached. Limit resets in 24 hours.',
                usage: {
                    used: user.apiUsage.requestCount,
                    limit: user.apiUsage.dailyLimit,
                    remaining: 0,
                    resetsIn: `${Math.ceil(hoursUntilReset)} hours`
                }
            })
        }

        // Make request using OpenAI client
        const completion = await ai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userText }
            ],
            temperature: 0.7,
            max_tokens: 1024
        })

        // Increment user's usage counter
        await user.incrementUsage()

        res.json({
            success: true,
            result: completion.choices[0].message.content,
            usage: {
                used: user.apiUsage.requestCount + 1,
                limit: user.apiUsage.dailyLimit,
                remaining: user.apiUsage.dailyLimit - (user.apiUsage.requestCount + 1)
            }
        })

    } catch (error) {
        console.error('Groq API Error:', error)
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process AI request'
        })
    }
}

// @desc    Get user's API usage stats
// @route   GET /api/groq/usage
// @access  Private
export const getUsageStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            })
        }

        // Calculate time until reset
        const lastReset = new Date(user.apiUsage.lastReset)
        const now = new Date()
        const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60)
        const hoursUntilReset = Math.max(0, 24 - hoursSinceReset)

        res.json({
            success: true,
            usage: {
                used: user.apiUsage.requestCount,
                limit: user.apiUsage.dailyLimit,
                remaining: user.getRemainingUsage(),
                lastReset: user.apiUsage.lastReset,
                resetsIn: hoursUntilReset > 0
                    ? `${Math.ceil(hoursUntilReset)} hours`
                    : 'Ready to reset'
            }
        })
    } catch (error) {
        console.error('Get usage stats error:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to get usage stats'
        })
    }
}

// @desc    Reset user's daily usage (admin or cron job)
// @route   POST /api/groq/reset
// @access  Private
export const resetUsage = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            })
        }

        user.apiUsage.requestCount = 0
        user.apiUsage.lastReset = new Date()
        await user.save()

        res.json({
            success: true,
            message: 'Usage reset successfully',
            usage: {
                used: 0,
                limit: user.apiUsage.dailyLimit,
                remaining: user.apiUsage.dailyLimit
            }
        })
    } catch (error) {
        console.error('Reset usage error:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to reset usage'
        })
    }
}