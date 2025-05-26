// backend/src/controllers/paymentController.ts
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { getUserById } from '../services/userService';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export const getPaymentMethods = async (req: Request, res: Response) => {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ success: false, message: 'Missing or invalid userId' });
  }

  try {
    const user = await getUserById(userId);

    if (!user || !user.stripeCustomerId) {
      return res.status(404).json({ success: false, message: 'Stripe customer not found' });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    res.json({ success: true, paymentMethods: paymentMethods.data });
  } catch (error) {
    console.error('Erreur Stripe :', error);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des cartes' });
  }
};
