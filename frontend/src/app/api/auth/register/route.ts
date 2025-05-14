import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import Stripe from 'stripe';
import crypto from 'crypto';
import { sendValidationEmail } from '@/utils/sendValidationEmail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-04-30.basil',
});

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password } = await req.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email déjà utilisé.' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');

    const customer = await stripe.customers.create({
      email,
      name: `${firstName} ${lastName}`,
    });

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `${firstName} ${lastName}`,
        lastname: lastName,
        role: 'USER',
        stripeCustomerId: customer.id,
        emailVerifiedToken: token,
      },
    });

    await sendValidationEmail(email, token);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Erreur inscription:', error);
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
  }
}
