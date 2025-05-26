import express from 'express'
import { loginUser } from '../../../../backend/src/controllers/authController'

const router = express.Router()

router.post('/login', loginUser)

export default router
