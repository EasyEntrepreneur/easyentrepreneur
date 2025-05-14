import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import prisma from '../../config/prisma';

dotenv.config();
const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15',
});

router.post('/', async (req: Request, res: Response) => {
  const { userId, paymentMethodId, amount, plan } = req.body;

  if (!userId || !paymentMethodId || !amount) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Création du paiement
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // centimes
      currency: 'eur',
      customer: user.stripeCustomerId,
      payment_method: paymentMethodId,
      confirm: true,
      metadata: {
        userId,
        plan,
      },
    });

    return res.status(200).json({ success: true, paymentIntent });
  } catch (err: any) {
    console.error('❌ Stripe error:', err);
    return res.status(500).json({ error: err.message || 'Erreur Stripe' });
  }
});

export default router;
