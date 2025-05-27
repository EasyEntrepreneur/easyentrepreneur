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

    // 1. Supprime les QuoteItems liés AVANT de supprimer les devis
    await prisma.quoteItem.deleteMany({
      where: {
        quoteId: { in: ids }
      }
    });

    // 2. Supprime les devis
    const result = await prisma.quote.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    return NextResponse.json({ message: "Devis supprimées", count: result.count });
  } catch (err: any) {
    console.error("Erreur suppression bulk quotes:", err);
    return NextResponse.json({ error: "Erreur serveur", details: err.message }, { status: 500 });
  }
}
