import { NextRequest, NextResponse } from "next/server";
import Stripe from 'stripe';
import prisma from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-04-30.basil',
});

// /api/stripe/payment-intent
export async function POST(req: NextRequest) {
  const url = req.nextUrl.pathname;

  if (url.endsWith("/payment-intent")) {
    try {
      const { amount, userId } = await req.json();

      if (!amount || !userId) {
        return NextResponse.json({ error: 'amount et userId requis' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || !user.stripeCustomerId) {
        return NextResponse.json({ error: 'Utilisateur ou customer Stripe non trouvé' }, { status: 404 });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'eur',
        customer: user.stripeCustomerId,
        automatic_payment_methods: { enabled: true },
      });

      return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error('Erreur Stripe PaymentIntent:', error);
      return NextResponse.json({ error: 'Erreur côté Stripe' }, { status: 500 });
    }
  }

  // /api/stripe/setup-intent
  if (url.endsWith("/setup-intent")) {
    try {
      const { userId, customerId } = await req.json();

      if (!userId || !customerId) {
        return NextResponse.json({ error: 'userId et customerId requis' }, { status: 400 });
      }

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
      });

      return NextResponse.json({ clientSecret: setupIntent.client_secret });
    } catch (error: any) {
      console.error('Erreur Stripe SetupIntent:', error?.raw || error);
      return NextResponse.json({ error: 'Erreur lors de la création du SetupIntent', details: error?.raw || error }, { status: 500 });
    }
  }

  // Fallback : non supporté
  return NextResponse.json({ error: "Endpoint Stripe non trouvé." }, { status: 404 });
}
