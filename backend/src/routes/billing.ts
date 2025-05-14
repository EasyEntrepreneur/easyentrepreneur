import express from 'express';
import { saveBillingInfo } from '../controllers/billingController';
import { authenticateToken } from '../middlewares/authenticateToken';

const router = express.Router();

// ✅ Route POST protégée : enregistre infos de facturation
router.post('/', authenticateToken, saveBillingInfo);

export default router;
