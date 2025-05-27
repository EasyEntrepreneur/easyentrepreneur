// frontend/src/app/api/quotes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateTokenApiRoute } from "@/lib/middlewares/authenticateTokenApiRoute";

export async function GET(req: NextRequest) {
  const auth = await authenticateTokenApiRoute(req);
  if ("status" in auth) return auth;

  // Récupère l'id depuis le chemin URL (ex: /api/quotes/cmb6sqz3g0001kw04izmiwvda)
  const url = new URL(req.url);
  const paths = url.pathname.split("/");
  const quoteId = paths[paths.length - 1];

  if (!quoteId) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId, userId: auth.userId },
    include: { items: true, client: true },
  });

  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  }

  return NextResponse.json(quote, { status: 200 });
}
