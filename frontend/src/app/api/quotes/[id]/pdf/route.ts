import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Récupération de l'id depuis l'URL (format: /api/quotes/xxxx/pdf)
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const quoteId = segments[segments.length - 2]; // /api/quotes/[id]/pdf

  if (!quoteId) {
    return new Response("ID manquant", { status: 400 });
  }

  // Récupérer le devis depuis Prisma
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true, client: true },
  });

  if (!quote) {
    return new Response("Devis introuvable", { status: 404 });
  }

  // Générer le HTML pour le devis (à personnaliser avec ton vrai template !)
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 2rem; }
          h1 { color: #4f46e5; }
        </style>
      </head>
      <body>
        <h1>Devis ${quote.number}</h1>
        <p>Client: ${quote.client?.name || ""}</p>
        <p>Date: ${quote.issuedAt ? new Date(quote.issuedAt).toLocaleDateString("fr-FR") : ""}</p>
        <p>Total: ${quote.totalTTC?.toLocaleString('fr-FR')} €</p>
        <hr/>
        <h2>Prestations :</h2>
        <ul>
          ${quote.items.map((item: any) => `<li>${item.description} - ${item.amount} €</li>`).join("")}
        </ul>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Devis-${quote.number}.pdf"`,
    },
  });
}
