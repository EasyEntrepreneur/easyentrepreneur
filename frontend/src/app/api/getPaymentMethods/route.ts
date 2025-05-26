import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-04-30.basil",
});

// GET /api/getPaymentMethods?userId=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 });
  }

  try {
    const methods = await prisma.paymentMethod.findMany({
      where: { userId },
    });

    const stripeMethods = await Promise.all(
      methods.map(async (method: { stripePaymentMethodId: string; }) => {
        try {
          const stripeMethod = await stripe.paymentMethods.retrieve(method.stripePaymentMethodId);

          if (stripeMethod.type === "card" && stripeMethod.card) {
            return {
              id: stripeMethod.id,
              brand: stripeMethod.card.brand,
              last4: stripeMethod.card.last4,
              exp_month: stripeMethod.card.exp_month,
              exp_year: stripeMethod.card.exp_year,
            };
          } else {
            return null;
          }
        } catch (error) {
          console.error("Erreur Stripe:", error);
          return null;
        }
      })
    );

    const filtered = stripeMethods.filter((m): m is NonNullable<typeof m> => m !== null);

    return NextResponse.json({
      success: true,
      paymentMethods: filtered,
    });
  } catch (error) {
    console.error("Erreur getPaymentMethods:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
