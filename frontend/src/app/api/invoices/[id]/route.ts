// frontend/src/app/api/invoices/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateTokenApiRoute } from "@/lib/middlewares/authenticateTokenApiRoute";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateTokenApiRoute(req);
  if ("status" in auth) return auth;

  const invoiceId = params.id;
  if (!invoiceId) {
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, userId: auth.userId },
    include: { items: true, client: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  // Si tu veux retourner l'HTML ou les infos de génération PDF ici :
  return NextResponse.json(invoice, { status: 200 });
}
