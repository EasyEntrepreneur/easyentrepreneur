import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

// Helper pour récupérer l’utilisateur via Prisma
async function getUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

// GET /api/payment/get-payment-methods?userId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'Missing or invalid userId' }, { status: 400 });
  }

  try {
    const user = await getUserById(userId);

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ success: false, message: 'Stripe customer not found' }, { status: 404 });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    return NextResponse.json({ success: true, paymentMethods: paymentMethods.data });
  } catch (error) {
    console.error('Erreur Stripe :', error);
    return NextResponse.json({ success: false, message: 'Erreur lors de la récupération des cartes' }, { status: 500 });
  }
}
