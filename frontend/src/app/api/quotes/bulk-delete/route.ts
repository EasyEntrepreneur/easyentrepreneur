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

    // Suppression sécurisée (ne supprime que les devis de ce user)
    await prisma.quote.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    return NextResponse.json({ message: "Devis supprimées !" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
