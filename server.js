import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import helmet from 'helmet'
import connectDB from './configs/database.js'
import userRouter from './routes/user.routes.js'
import groqRouter from './routes/groq.routes.js'
import historyRouter from './routes/history.routes.js'

const app = express()

// Connect to MongoDB
await connectDB()

// Middleware
app.use(helmet())
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.get('/', (req, res) => res.send('AI Study Helper API is running...'))
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/user', userRouter)
app.use('/api/groq', groqRouter)
app.use('/api/history', historyRouter)

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal server error',
            status: err.status || 500
        }
    })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})