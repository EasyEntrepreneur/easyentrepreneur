import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Récupération de l'id depuis l'URL (format: /api/invoices/xxxx/pdf)
  const url = new URL(req.url);
  const segments = url.pathname.split("/");
  const invoiceId = segments[segments.length - 2]; // /api/invoices/[id]/pdf

  if (!invoiceId) {
    return new Response("ID manquant", { status: 400 });
  }

  // Récupérer la facture depuis Prisma
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true, client: true },
  });

  if (!invoice) {
    return new Response("Facture introuvable", { status: 404 });
  }

  // Générer le HTML pour la facture (à personnaliser avec ton vrai template !)
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 2rem; }
          h1 { color: #4f46e5; }
        </style>
      </head>
      <body>
        <h1>Facture ${invoice.number}</h1>
        <p>Client: ${invoice.client?.name || ""}</p>
        <p>Date: ${invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString("fr-FR") : ""}</p>
        <p>Total: ${invoice.totalTTC?.toLocaleString('fr-FR')} €</p>
        <hr/>
        <h2>Prestations :</h2>
        <ul>
          ${invoice.items.map((item: any) => `<li>${item.description} - ${item.amount} €</li>`).join("")}
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
      "Content-Disposition": `inline; filename="Facture-${invoice.number}.pdf"`,
    },
  });
}
