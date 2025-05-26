import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import bcrypt from "bcryptjs"; // Attention : c’est souvent `bcryptjs` côté Node, mais garde ce que tu utilises
// dotenv inutile ici, Next.js charge déjà tes variables d'env

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, lastname } = body;

    if (!email || !password || !name || !lastname) {
      return NextResponse.json(
        { error: "Champs requis manquants." },
        { status: 400 }
      );
    }

    // Vérifie si l'utilisateur existe déjà
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Utilisateur déjà existant." },
        { status: 409 }
      );
    }

    // Crée le client Stripe
    const customer = await stripe.customers.create({
      email,
      name: `${name} ${lastname}`,
    });

    // Hash le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crée l’utilisateur
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        lastname,
        stripeCustomerId: customer.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: { id: newUser.id, email: newUser.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur register:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
