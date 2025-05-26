import { NextRequest, NextResponse } from "next/server";
import { authenticateTokenApiRoute } from "@/lib/middlewares/authenticateTokenApiRoute";
import prisma from "@/lib/prisma";

// GET /api/issuer
export async function GET(req: NextRequest) {
  // 1. Vérifier le token JWT via le middleware dédié
  const auth = await authenticateTokenApiRoute(req);
  if ("status" in auth) return auth; // renvoie l’erreur si token invalide

  // 2. Chercher les infos de l’émetteur (companyInfo) lié à l’utilisateur
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
