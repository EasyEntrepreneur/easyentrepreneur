import express from 'express';
import { saveBillingInfo } from '../../../../backend/src/controllers/billingController';
import { authenticateToken } from '../../../../backend/src/middlewares/authenticateToken';

const router = express.Router();

// ✅ Route POST protégée : enregistre infos de facturation
router.post('/', authenticateToken, saveBillingInfo);

export default router;
