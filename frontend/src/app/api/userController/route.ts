import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prisma';
import { authenticateTokenApiRoute } from '@/lib/middlewares/authenticateTokenApiRoute';

export async function GET(req: NextRequest) {
  // Authentifie le token (doit retourner { userId } si OK)
  const authResult = await authenticateTokenApiRoute(req);
  if ("status" in authResult) return authResult as NextResponse;
  const userId = authResult.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        billingInfo: true,
        companyInfo: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        emailVerified: user.emailVerified,
        billingName: user.billingInfo?.name || '',
        billingLastname: user.billingInfo?.lastname || '',
        billingEmail: user.billingInfo?.email || '',
        billingCountry: user.billingInfo?.country || '',
        billingAddress: user.billingInfo?.address1 || '',
        billingZip: user.billingInfo?.zip || '',
        billingCity: user.billingInfo?.city || '',
        billingCompany: user.billingInfo?.company || '',
        billingVat: user.billingInfo?.vat || '',
        companyName: user.companyInfo?.name || '',
        companyAddress: user.companyInfo?.address || '',
        companyZip: user.companyInfo?.zip || '',
        companyCity: user.companyInfo?.city || '',
        companySiret: user.companyInfo?.siret || '',
        companyVat: user.companyInfo?.vat || '',
        companyPhone: user.companyInfo?.phone || ''
      }
    });
  } catch (error: any) {
    console.error('[GET /me] Erreur :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
