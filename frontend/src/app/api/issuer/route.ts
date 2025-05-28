import { NextRequest, NextResponse } from "next/server";
import { authenticateTokenApiRoute } from "@/lib/middlewares/authenticateTokenApiRoute";
import prisma from "@/lib/prisma";

// GET /api/issuer — récupère la fiche companyInfo (émetteur)
export async function GET(req: NextRequest) {
  const auth = await authenticateTokenApiRoute(req);
  if ("status" in auth) return auth; // renvoie l’erreur si token invalide

  try {
    const issuer = await prisma.companyInfo.findUnique({
      where: { userId: auth.userId },
      select: {
        name: true,
        address: true,
        zip: true,
        city: true,
        siret: true,
        vat: true,
        phone: true,
      },
    });

    if (!issuer) {
      return NextResponse.json({ error: "Émetteur non trouvé" }, { status: 404 });
    }

    return NextResponse.json(issuer, { status: 200 });
  } catch (err) {
    console.error("API /issuer error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/issuer — crée ou met à jour la fiche companyInfo
export async function POST(req: NextRequest) {
  const auth = await authenticateTokenApiRoute(req);
  if ("status" in auth) return auth;

  const {
    name,
    address,
    zip,
    city,
    siret,
    vat,
    phone,
  } = await req.json();

  try {
    let companyInfo = await prisma.companyInfo.findUnique({
      where: { userId: auth.userId }
    });

    if (companyInfo) {
      // Met à jour la fiche existante
      companyInfo = await prisma.companyInfo.update({
        where: { userId: auth.userId },
        data: { name, address, zip, city, siret, vat, phone }
      });
    } else {
      // Crée une nouvelle fiche émetteur pour cet utilisateur
      companyInfo = await prisma.companyInfo.create({
        data: {
          userId: auth.userId,
          name,
          address,
          zip,
          city,
          siret,
          vat,
          phone
        }
      });
    }

    return NextResponse.json(companyInfo, { status: 200 });
  } catch (err) {
    console.error("API /issuer POST error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
