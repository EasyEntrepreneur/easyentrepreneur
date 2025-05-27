import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verify } from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const token = auth.replace("Bearer ", "");
    const decoded = verify(token, process.env.JWT_SECRET!);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const userId = decoded.userId;

    const body = await request.json();
    const { ids } = body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Aucun ID fourni" }, { status: 400 });
    }

    // 1. Supprime les InvoiceItems liés AVANT de supprimer les factures
    await prisma.invoiceItem.deleteMany({
      where: {
        invoiceId: { in: ids }
      }
    });

    // 2. Supprime les factures
    const result = await prisma.invoice.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    return NextResponse.json({ message: "Factures supprimées", count: result.count });
  } catch (err: any) {
    console.error("Erreur suppression bulk invoices:", err);
    return NextResponse.json({ error: "Erreur serveur", details: err.message }, { status: 500 });
  }
}
