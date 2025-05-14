// backend/src/routes/stripe.ts
import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import prisma from '../config/prisma';

dotenv.config();

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15',
});

// ✅ Route pour créer un PaymentIntent
router.post('/payment-intent', async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, userId } = req.body;

    if (!amount || !userId) {
      res.status(400).json({ error: 'amount et userId requis' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.stripeCustomerId) {
      res.status(404).json({ error: 'Utilisateur ou customer Stripe non trouvé' });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      customer: user.stripeCustomerId,
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Erreur Stripe PaymentIntent:', error);
    res.status(500).json({ error: 'Erreur côté Stripe' });
  }
});

// ✅ Route pour créer un SetupIntent
router.post('/setup-intent', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, customerId } = req.body;

    if (!userId || !customerId) {
      res.status(400).json({ error: 'userId et customerId requis' });
      return;
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error: any) {
    console.error('Erreur Stripe SetupIntent:', error?.raw || error);
    res.status(500).json({ error: 'Erreur lors de la création du SetupIntent', details: error?.raw || error });
  }
});


export default router;

