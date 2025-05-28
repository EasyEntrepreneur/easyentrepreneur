import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const invoiceId = params.id;
  if (!invoiceId) {
    return new Response("ID manquant", { status: 400 });
  }

  // Récupérer la facture depuis Prisma (adapter le include selon ton modèle)
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true, client: true },
  });

  if (!invoice) {
    return new Response("Facture introuvable", { status: 404 });
  }

  // Générer le HTML pour la facture (ici très simple à adapter à ton template !)
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

  // Générer le PDF avec Puppeteer
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
