import express from 'express'
import { generateCode } from '../controllers/generateController.js'

const router = express.Router()

router.get('/:sessionId', generateCode)

export default router