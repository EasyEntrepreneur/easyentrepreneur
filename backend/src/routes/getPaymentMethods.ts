// backend/src/routes/getPaymentMethods.ts
import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import prisma from '../config/prisma';

dotenv.config();

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2022-11-15',
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'userId requis' });
    return;
  }

  try {
    const methods = await prisma.paymentMethod.findMany({
      where: { userId },
    });

    const stripeMethods = await Promise.all(
      methods.map(async (method: { stripePaymentMethodId: string }) => {
        try {
          const stripeMethod = await stripe.paymentMethods.retrieve(method.stripePaymentMethodId);
          return {
            id: method.stripePaymentMethodId,
            brand: stripeMethod.card?.brand,
            last4: stripeMethod.card?.last4,
            exp_month: stripeMethod.card?.exp_month,
            exp_year: stripeMethod.card?.exp_year,
          };
        } catch (error) {
          console.error('Erreur Stripe:', error);
          return null;
        }
      })
    );

    const filtered = stripeMethods.filter(
      (m): m is NonNullable<typeof m> => m !== null
    );

    res.json(filtered);
  } catch (error) {
    console.error('Erreur getPaymentMethods:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
