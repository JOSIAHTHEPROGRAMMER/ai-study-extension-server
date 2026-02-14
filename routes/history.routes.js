import express from 'express'
import {
    saveHistory,
    getHistory,
    getHistoryById,
    deleteHistory,
    clearHistory,
    getHistoryStats,
    cleanupOldHistory
} from '../controllers/history.controller.js'
import { protect } from '../middleware/auth.js'

const historyRouter = express.Router()

// All routes are protected
historyRouter.post('/', protect, saveHistory)
historyRouter.get('/', protect, getHistory)
historyRouter.get('/stats', protect, getHistoryStats)
historyRouter.get('/:id', protect, getHistoryById)
historyRouter.delete('/clear', protect, clearHistory)
historyRouter.delete('/cleanup', protect, cleanupOldHistory)
historyRouter.delete('/:id', protect, deleteHistory)

export default historyRouter