// backend/src/routes/stripe/pay.ts
import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import prisma from '../../lib/prisma';
import { sendConfirmationEmail } from '../../utils/sendEmail';


dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15',
});

const router = express.Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { userId, paymentMethodId, amount, plan } = req.body;

  if (!userId || !paymentMethodId || !amount || !plan) {
    res.status(400).json({ success: false, error: 'Paramètres requis manquants.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId || !user.email) {
      res.status(404).json({ success: false, error: 'Utilisateur ou email introuvable' });
      return;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      customer: user.stripeCustomerId,
      payment_method: paymentMethodId,
      confirm: true,
    });

    // 🔐 Mise à jour du plan dans la base de données
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentPlan: plan.toUpperCase(), // 'BASIC' | 'STANDARD' | 'PREMIUM'
      },
    });

    // 📧 Envoi de l'email de confirmation
    await sendConfirmationEmail(
      user.email,
      user.name ?? '',
      plan.toUpperCase()
    );

    res.json({ success: true, paymentIntentId: paymentIntent.id });
  } catch (err: any) {
    console.error('Erreur Stripe paymentIntent:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Erreur de paiement',
    });
  }
});

export default router;
