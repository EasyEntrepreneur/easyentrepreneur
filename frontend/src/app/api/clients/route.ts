// /frontend/src/app/api/clients/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateToken } from "@/lib/middlewares/authenticateToken";

// Lister tous les clients de l'utilisateur connecté
export async function GET(request: NextRequest) {
  // Authentification
  const user = await authenticateToken(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    // Récupérer un client précis
    const client = await prisma.client.findFirst({
      where: { id, userId: user.userId },
    });
    if (!client)
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json(client);
  }

  // Lister tous les clients de l'utilisateur connecté
  const clients = await prisma.client.findMany({
    where: { userId: user.userId },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(clients);
}

// Créer un nouveau client lié à l'utilisateur connecté
export async function POST(request: NextRequest) {
  const user = await authenticateToken(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, address, zip, city, siret, vat, phone } = body;

  if (!name || !address || !zip || !city || !siret) {
    return NextResponse.json(
      { error: "Champs obligatoires manquants" },
      { status: 400 }
    );
  }

  const client = await prisma.client.create({
    data: { name, address, zip, city, siret, vat, phone, userId: user.userId },
  });
  return NextResponse.json(client);
}
