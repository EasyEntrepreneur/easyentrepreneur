import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateToken } from "@/lib/middlewares/authenticateToken";

// Route POST : Enregistre les infos de facturation
export async function POST(request: NextRequest) {
  // Authentification
  const user = await authenticateToken(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      lastname,
      email,
      country,
      address1,
      city,
      zip,
      company,
      vat,
    } = body;

    if (!name || !lastname || !email || !country || !address1 || !city || !zip) {
      return NextResponse.json(
        { error: "Champs requis manquants." },
        { status: 400 }
      );
    }

    // Met à jour ou crée les infos de facturation pour l'utilisateur
    const billingInfo = await prisma.billingInfo.upsert({
      where: { userId: user.userId },
      update: {
        name,
        lastname,
        email,
        country,
        address1,
        city,
        zip,
        company,
        vat,
      },
      create: {
        userId: user.userId,
        name,
        lastname,
        email,
        country,
        address1,
        city,
        zip,
        company,
        vat,
      },
    });

    return NextResponse.json({ success: true, billingInfo });
  } catch (error) {
    console.error("Erreur sauvegarde infos de facturation :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la sauvegarde des infos de facturation." },
      { status: 500 }
    );
  }
}
