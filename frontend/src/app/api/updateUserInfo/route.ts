import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from '@/lib/prisma';
import { authenticateTokenApiRoute } from "@/lib/middlewares/authenticateTokenApiRoute";

// UPDATE USER (infos perso)
export async function PUT(req: NextRequest) {
  // On check le sous-path pour router les requêtes PUT
  const url = req.nextUrl.pathname;

  // Parse les données reçues
  const body = await req.json();
  const authResult = await authenticateTokenApiRoute(req);
  if ("status" in authResult) return authResult as NextResponse;
  const userId = authResult.userId;

  // 1. Mise à jour des infos perso : /api/updateUserInfo/update-user
  if (url.endsWith('/update-user')) {
    try {
      const { name, lastname, email, password } = body;
      const data: any = { name, lastname, email };
      if (password && password.length > 3) {
        data.password = await bcrypt.hash(password, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data,
      });

      return NextResponse.json({ success: true, user: updatedUser });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'Erreur mise à jour utilisateur' }, { status: 500 });
    }
  }

  // 2. Mise à jour des infos de facturation : /api/updateUserInfo/update-billing
  if (url.endsWith('/update-billing')) {
    try {
      const billingInfo = await prisma.billingInfo.upsert({
        where: { userId },
        update: {
          name: body.billingName,
          lastname: body.billingLastname,
          email: body.billingEmail,
          country: body.billingCountry,
          address1: body.billingAddress,
          zip: body.billingZip,
          city: body.billingCity,
          company: body.billingCompany,
          vat: body.billingVat,
        },
        create: {
          userId: userId,
          name: body.billingName,
          lastname: body.billingLastname,
          email: body.billingEmail,
          country: body.billingCountry,
          address1: body.billingAddress,
          zip: body.billingZip,
          city: body.billingCity,
          company: body.billingCompany,
          vat: body.billingVat,
        },
      });

      return NextResponse.json({ success: true, billingInfo });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'Erreur mise à jour facturation' }, { status: 500 });
    }
  }

  // 3. Mise à jour des infos entreprise : /api/updateUserInfo/update-company
  if (url.endsWith('/update-company')) {
    try {
      const company = await prisma.companyInfo.upsert({
        where: { userId },
        update: {
          name: body.companyName,
          address: body.companyAddress,
          zip: body.companyZip,
          city: body.companyCity,
          siret: body.companySiret,
          vat: body.companyVat,
          phone: body.companyPhone,
        },
        create: {
          userId: userId,
          name: body.companyName,
          address: body.companyAddress,
          zip: body.companyZip,
          city: body.companyCity,
          siret: body.companySiret,
          vat: body.companyVat,
          phone: body.companyPhone,
        },
      });

      return NextResponse.json({ success: true, company });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'Erreur mise à jour entreprise' }, { status: 500 });
    }
  }

  // Endpoint inconnu
  return NextResponse.json({ error: "Mauvais endpoint" }, { status: 404 });
}
