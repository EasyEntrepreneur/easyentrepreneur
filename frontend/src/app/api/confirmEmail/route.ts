import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Récupère le token depuis l’URL (query string)
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token manquant" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { emailVerifiedToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: "Token invalide" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerifiedToken: null,
      },
    });

    // Redirige proprement vers le front
    // (Assure-toi que process.env.FRONT_URL est bien accessible)
    const FRONT_URL = process.env.FRONT_URL || "http://localhost:3000";
    return NextResponse.redirect(`${FRONT_URL}/email-confirmed`);
  } catch (error) {
    console.error("Erreur lors de la confirmation email :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
