import { NextRequest, NextResponse } from "next/server";
import prisma from '@/lib/prisma';
import { authenticateTokenApiRoute } from '@/lib/middlewares/authenticateTokenApiRoute';
import path from 'path';
import fs from 'fs/promises';
import * as fsSync from 'fs';
import * as htmlPdfNode from 'html-pdf-node';

// Génère un PDF depuis HTML et retourne un Buffer
async function generateQuotePdfWithHtmlPdfNode(html: string): Promise<Buffer> {
  const options = {
    format: 'A4',
    printBackground: true,
    margin: { top: '30px', bottom: '30px', left: '20px', right: '20px' }
  };
  // 👇 Cette ligne doit retourner un Promise<Buffer>
  return htmlPdfNode.generatePdf({ content: html }, options) as unknown as Buffer;
}
// POST /api/quotes — création d'un devis + PDF (HTML dans body)
export async function POST(req: NextRequest) {
  const authResult = await authenticateTokenApiRoute(req);
  // Si NextResponse est retourné, c'est une erreur d'auth
  if ("status" in authResult) return authResult as NextResponse;
  const userId = authResult.userId;

  const data = await req.json();
  const { client, validUntil, items, quoteHtml, ...rest } = data;

  if (!quoteHtml) {
    return NextResponse.json({ error: "Le champ quoteHtml (HTML du devis) est requis." }, { status: 400 });
  }

  try {
    // Client existant ou à créer
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

    // Génération numéro unique pour le devis (par année)
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

    // Calcul totaux
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

    // Création du devis en base
    let newQuote = await prisma.quote.create({
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
        quoteHtml // <--- Stocke l'HTML pour pouvoir regénérer le PDF à l'identique !
      },
      include: { items: true, client: true },
    });

    // GÉNÉRATION PDF AVEC HTML-PDF-NODE
    const pdfBuffer = await generateQuotePdfWithHtmlPdfNode(quoteHtml);

    // Sauvegarder le PDF dans un dossier temporaire (optionnel, à adapter)
    const pdfDir = path.join(process.cwd(), "public", "quotes_pdf");
    if (!fsSync.existsSync(pdfDir)) await fs.mkdir(pdfDir, { recursive: true });
    const pdfFilename = `${newQuote.number}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFilename);
    await fs.writeFile(pdfPath, pdfBuffer);

    // MAJ chemin PDF en base
    newQuote = await prisma.quote.update({
      where: { id: newQuote.id },
      data: { pdfPath: pdfFilename },
      include: { items: true, client: true },
    });

    return NextResponse.json({
      ...newQuote,
      pdfUrl: `/quotes_pdf/${newQuote.number}.pdf`
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erreur POST /quotes :', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur lors de la création du devis.' }, { status: 500 });
  }
}
