import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil", // ← Utilise une version stable officiellement supportée
});

export async function POST(request: NextRequest) {
  try {
    const { montant, email } = await request.json();

    if (!montant || !email) {
      return NextResponse.json(
        { error: "montant et email sont obligatoires" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Paiement EasyEntrepreneur",
            },
            unit_amount: Math.round(Number(montant) * 100), // Arrondi et force nombre
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `${request.nextUrl.origin}/success`,
      cancel_url: `${request.nextUrl.origin}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Erreur Stripe Checkout:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur Stripe" },
      { status: 500 }
    );
  }
}
