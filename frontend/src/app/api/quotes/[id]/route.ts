// frontend/src/app/api/quotes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateTokenApiRoute } from "@/lib/middlewares/authenticateTokenApiRoute";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateTokenApiRoute(req);
  if ("status" in auth) return auth;

  const quoteId = params.id;
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

  // Si tu veux retourner l'HTML ou les infos de génération PDF ici :
  return NextResponse.json(quote, { status: 200 });
}
