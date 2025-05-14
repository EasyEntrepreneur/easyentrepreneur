import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { emailVerifiedToken: token },
  });

  if (!user) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerifiedToken: null,
    },
  });

  return NextResponse.redirect(`${process.env.FRONT_URL}/email-confirmed`);
}
