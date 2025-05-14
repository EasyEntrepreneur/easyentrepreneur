// backend/src/routes/payment.ts
import express from 'express';
import { getPaymentMethods } from '../controllers/paymentController';

const router = express.Router();

// GET /api/get-payment-methods?userId=xxx
router.get('/get-payment-methods', getPaymentMethods);

export default router;
