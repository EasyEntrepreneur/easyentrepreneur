import { NextRequest, NextResponse } from "next/server";
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { sendConfirmationEmail } from '@/lib/utils/sendEmail'; // Corrige si le chemin diffère

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-04-30.basil',
});

export async function POST(req: NextRequest) {
  try {
    const { userId, paymentMethodId, amount, plan } = await req.json();

    if (!userId || !paymentMethodId || !amount || !plan) {
      return NextResponse.json({ success: false, error: 'Paramètres requis manquants.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId || !user.email) {
      return NextResponse.json({ success: false, error: 'Utilisateur ou email introuvable' }, { status: 404 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
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

    return NextResponse.json({ success: true, paymentIntentId: paymentIntent.id });
  } catch (err: any) {
    console.error('Erreur Stripe paymentIntent:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Erreur de paiement',
    }, { status: 500 });
  }
}
