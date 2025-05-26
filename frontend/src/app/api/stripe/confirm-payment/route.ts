import { NextRequest, NextResponse } from "next/server";
import Stripe from 'stripe';
import prisma from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-04-30.basil',
});

export async function POST(req: NextRequest) {
  try {
    const { userId, paymentMethodId, amount, plan } = await req.json();

    if (!userId || !paymentMethodId || !amount) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
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

    return NextResponse.json({ success: true, paymentIntent });
  } catch (err: any) {
    console.error('❌ Stripe error:', err);
    return NextResponse.json({ error: err.message || 'Erreur Stripe' }, { status: 500 });
  }
}
