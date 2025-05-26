import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialise Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

// POST /api/paymentIntent
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Montant en centimes (€)
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Erreur PaymentIntent :', error.message);
    return NextResponse.json(
      { error: 'Erreur lors de la création du Payment Intent' },
      { status: 500 }
    );
  }
}
