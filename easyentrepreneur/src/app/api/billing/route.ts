// /app/api/billing/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const body = await req.json();
  console.log('Body reçu:', body);

  try {
    const existingBilling = await prisma.billingInfo.findFirst({
      where: { userId: session.user.id },
    });

    let billing;

    if (existingBilling) {
      billing = await prisma.billingInfo.update({
        where: { id: existingBilling.id },
        data: {
          name: body.name,
          lastname: body.lastname,
          email: body.email,
          country: body.country,
          address1: body.address1 || '',
          city: body.city,
          zip: body.zip,
          company: body.company || '',
          vat: body.vat || ''
        },
      });
    } else {
      billing = await prisma.billingInfo.create({
        data: {
          userId: session.user.id,
          name: body.name,
          lastname: body.lastname,
          email: body.email,
          country: body.country,
          address1: body.address1 || '',
          city: body.city,
          zip: body.zip,
          company: body.company || '',
          vat: body.vat || ''
        },
      });
    }

    return NextResponse.json({ success: true, billing });
  } catch (error: any) {
    console.error('Erreur enregistrement billing:', error.message, error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
