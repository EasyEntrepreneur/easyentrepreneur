import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prisma';

// POST /api/savePaymentMethod
export async function POST(req: NextRequest) {
  try {
    const { userId, paymentMethodId } = await req.json();

    if (!userId || !paymentMethodId) {
      return NextResponse.json({ error: 'userId et paymentMethodId requis' }, { status: 400 });
    }

    // Empêche les doublons en base
    const existing = await prisma.paymentMethod.findUnique({
      where: { stripePaymentMethodId: paymentMethodId },
    });

    if (!existing) {
      await prisma.paymentMethod.create({
        data: {
          userId,
          stripePaymentMethodId: paymentMethodId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur savePaymentMethod:', error);
    return NextResponse.json({ error: 'Erreur lors de l’enregistrement' }, { status: 500 });
  }
}
