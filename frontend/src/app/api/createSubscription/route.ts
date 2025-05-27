import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// Whitelist des priceId autorisés
const ALLOWED_PRICE_IDS = [
  "price_1ROhlzGxzBu5ejULKZIByW1f", // Basique
  "price_1ROhjyGxzBu5ejULSWzAUYlF", // Standard
  "price_1ROhmSGxzBu5ejULeOnma7aZ", // Premium
];

export async function POST(request: NextRequest) {
  try {
    const { customerId, paymentMethodId, priceId } = await request.json();

    if (!customerId || !paymentMethodId || !priceId) {
      return NextResponse.json(
        { error: "Champs requis manquants." },
        { status: 400 }
      );
    }

    if (!ALLOWED_PRICE_IDS.includes(priceId)) {
      return NextResponse.json(
        { error: "Identifiant de tarif invalide." },
        { status: 403 }
      );
    }

    // 1. Attache la carte au client
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // 2. Définit la carte comme méthode de paiement par défaut
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // 3. Crée la subscription avec payment_intent inclus
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ["latest_invoice.payment_intent"],
    });

    let clientSecret: string | null = null;

    // Correction de typage ici
    const latestInvoice = (subscription.latest_invoice as any) || null;
    if (
      latestInvoice &&
      typeof latestInvoice !== "string" &&
      latestInvoice.payment_intent &&
      typeof latestInvoice.payment_intent !== "string"
    ) {
      clientSecret = latestInvoice.payment_intent.client_secret;
    }

    if (!clientSecret) {
      throw new Error("Impossible d'obtenir le client_secret du paiement.");
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret,
    });
  } catch (error: any) {
    console.error("Erreur lors de la création de la subscription :", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
