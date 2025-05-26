import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    // Récupère le token JWT de l'en-tête
    const auth = req.headers.get("authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }
    const token = auth.split(" ")[1];

    // Vérifie et décode le token
    let payload: any;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }
    const userId = payload.userId || payload.id;

    // Récupère l'offre de l'utilisateur
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isFreemium = user?.currentPlan === "FREEMIUM";
    const quotaMax = isFreemium ? 5 : 99999;

    // Calcule le début et la fin du mois
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Compte les factures créées ce mois
    const invoicesCount = await prisma.invoice.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    // Compte les devis créés ce mois
    const quotesCount = await prisma.quote.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    // Additionne tous les documents générés
    const docsCount = invoicesCount + quotesCount;

    return NextResponse.json({
      used: docsCount,
      max: quotaMax,
      offer: user?.currentPlan,
    });
  } catch (error: any) {
    console.error("Erreur /quota :", error.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
