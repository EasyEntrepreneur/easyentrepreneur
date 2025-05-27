import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prisma';
import { authenticateTokenApiRoute } from '@/lib/middlewares/authenticateTokenApiRoute';

// Utilitaire pour sécuriser le retour de l'auth
function isUser(obj: any): obj is { userId: string } {
  return obj && typeof obj.userId === "string";
}

// POST /api/quotes — création d'un devis (HTML dans body, pas de PDF ici !)
export async function POST(req: NextRequest) {
  const auth = await authenticateTokenApiRoute(req);
  if (!isUser(auth)) return auth; // Auth échouée = return NextResponse direct
  const userId = auth.userId;

  const data = await req.json();
  const { client, validUntil, items, quoteHtml, ...rest } = data;

  if (!quoteHtml) {
    return NextResponse.json({ error: "Le champ quoteHtml (HTML du devis) est requis." }, { status: 400 });
  }

  try {
    // Recherche ou création du client
    let dbClient = null;
    if (client.siret) {
      dbClient = await prisma.client.findFirst({ where: { userId, siret: client.siret } });
    }
    if (!dbClient) {
      dbClient = await prisma.client.findFirst({
        where: {
          userId,
          name: client.name,
          address: client.address,
          zip: client.zip,
          city: client.city,
        }
      });
    }
    if (!dbClient) {
      const clientToInsert = {
        name: client.name,
        address: client.address,
        zip: client.zip,
        city: client.city,
        siret: client.siret || "",
        vat: client.vat || "",
        phone: client.phone || "",
        userId
      };
      dbClient = await prisma.client.create({ data: clientToInsert });
    }

    // Génération d'un numéro unique pour le devis
    const year = new Date().getFullYear();
    const regex = new RegExp(`^${year}-(\\d{3})$`);
    const quotesThisYear = await prisma.quote.findMany({
      where: { userId, number: { startsWith: `${year}-` } },
      select: { number: true }
    });
    let nextNumber = 1;
    if (quotesThisYear.length > 0) {
      const nums = quotesThisYear
        .map((q: any) => {
          const match = q.number.match(regex);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter((n: number) => !isNaN(n));
      if (nums.length > 0) {
        nextNumber = Math.max(...nums) + 1;
      }
    }
    let number = `${year}-${String(nextNumber).padStart(3, '0')}`;
    let exists = await prisma.quote.findUnique({ where: { number } });
    let tries = 0;
    const maxTries = 10;
    while (exists && tries < maxTries) {
      nextNumber++;
      number = `${year}-${String(nextNumber).padStart(3, '0')}`;
      exists = await prisma.quote.findUnique({ where: { number } });
      if (!exists) break;
      tries++;
    }
    if (tries === maxTries && exists) {
      return NextResponse.json({ error: "Impossible de générer un numéro de devis unique. Veuillez réessayer." }, { status: 500 });
    }

    // Calcul des totaux
    let totalHT = 0;
    let totalTVA = 0;
    let totalTTC = 0;
    const quoteItems = items.map((item: any) => {
      const ht = item.unitPrice * item.quantity;
      const tva = ht * (item.vatRate / 100);
      const ttc = ht + tva;
      totalHT += ht;
      totalTVA += tva;
      totalTTC += ttc;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        totalHT: ht,
        totalTVA: tva,
        totalTTC: ttc,
      };
    });

    // Création du devis dans la base, stockage de l'HTML (PAS de PDF)
    const newQuote = await prisma.quote.create({
      data: {
        number,
        userId,
        statut: "EN_ATTENTE",
        clientId: dbClient.id,
        clientName: client.name,
        clientAddress: client.address,
        clientZip: client.zip,
        clientCity: client.city,
        clientEmail: client.email,
        clientPhone: client.phone,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        totalHT,
        totalTVA,
        totalTTC,
        notes: rest.notes,
        items: { createMany: { data: quoteItems } },
        quoteHtml // <- L'HTML pour génération PDF côté client !
      },
      include: { items: true, client: true },
    });

    // Pas de génération PDF ici ! Juste retour de la ressource
    return NextResponse.json({
      ...newQuote,
      // Tu peux ajouter un endpoint ici pour télécharger le PDF généré côté client si besoin
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erreur POST /quotes :', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur lors de la création du devis.' }, { status: 500 });
  }
}
