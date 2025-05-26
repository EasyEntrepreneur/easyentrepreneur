import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Mot de passe invalide" }, { status: 401 });
    }

    const jwtSecret: Secret = process.env.JWT_SECRET || "fallback_secret";
    const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as `${number}${"d" | "h" | "m" | "s"}`;
    const signOptions: SignOptions = { expiresIn };

    const token = jwt.sign({ userId: user.id }, jwtSecret, signOptions);

    return NextResponse.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? "",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
