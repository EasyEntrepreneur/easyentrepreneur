// backend/src/routes/createSubscription.ts
import express, { Request, Response } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

const router = express.Router();

// Facultatif : whitelist des priceId autorisés (sécurité)
const ALLOWED_PRICE_IDS = [
  'price_1ROhlzGxzBu5ejULKZIByW1f', // Basique
  'price_1ROhjyGxzBu5ejULSWzAUYlF', // Standard
  'price_1ROhmSGxzBu5ejULeOnma7aZ', // Premium
];

router.post('/create-subscription', async (req: Request, res: Response) => {
  const { customerId, paymentMethodId, priceId } = req.body;

  if (!customerId || !paymentMethodId || !priceId) {
    return res.status(400).json({ error: 'Champs requis manquants.' });
  }

  // 🔐 Vérifie que le priceId est autorisé
  if (!ALLOWED_PRICE_IDS.includes(priceId)) {
    return res.status(403).json({ error: 'Identifiant de tarif invalide.' });
  }

  try {
    // 1. Attache la carte au client
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // 2. Définit la carte comme méthode de paiement par défaut
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // 3. Crée la subscription avec payment_intent inclus
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
    });

    let clientSecret: string | null = null;

    if (
    subscription.latest_invoice &&
    typeof subscription.latest_invoice !== 'string' &&
    subscription.latest_invoice.payment_intent &&
    typeof subscription.latest_invoice.payment_intent !== 'string'
    ) {
    clientSecret = subscription.latest_invoice.payment_intent.client_secret;
    }

    if (!clientSecret) {
      throw new Error("Impossible d'obtenir le client_secret du paiement.");
    }

    res.json({
      subscriptionId: subscription.id,
      clientSecret,
    });
  } catch (error: any) {
    console.error('Erreur lors de la création de la subscription :', error.message);
    res.status(400).json({ error: error.message });
  }
});

export default router;
