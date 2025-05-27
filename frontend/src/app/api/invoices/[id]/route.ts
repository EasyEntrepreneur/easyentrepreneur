// frontend/src/app/api/invoices/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateTokenApiRoute } from "@/lib/middlewares/authenticateTokenApiRoute";

export async function GET(req: NextRequest) {
  const auth = await authenticateTokenApiRoute(req);
  if ("status" in auth) return auth;

  // ⚡️ On récupère l'id via l'URL, car Next.js ne fournit PAS { params } côté API !
  const url = new URL(req.url);
  // /api/invoices/cmb6sqz3g0001kw04izmiwvda → on split et on prend le dernier segment
  const paths = url.pathname.split("/");
  const invoiceId = paths[paths.length - 1];

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

  return NextResponse.json(invoice, { status: 200 });
}
