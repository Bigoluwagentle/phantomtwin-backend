import express from 'express'
import { redesignWebsite } from '../controllers/redesignController.js'

const router = express.Router()

router.post('/:sessionId', redesignWebsite)

export default router