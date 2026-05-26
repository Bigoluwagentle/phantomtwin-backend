import express from 'express'
import { startAnalysis, getAnalysisStatus } from '../controllers/analysisController.js'

const router = express.Router()

router.post('/start', startAnalysis)
router.get('/status/:sessionId', getAnalysisStatus)

export default router