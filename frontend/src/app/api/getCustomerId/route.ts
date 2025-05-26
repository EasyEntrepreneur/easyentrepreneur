import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/getCustomerId?userId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: "stripeCustomerId introuvable" }, { status: 404 });
    }

    return NextResponse.json({ stripeCustomerId: user.stripeCustomerId });
  } catch (error) {
    console.error("Erreur get-customer-id:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
