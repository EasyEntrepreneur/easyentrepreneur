import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabaseAdmin";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const quoteId = params.id;
  if (!quoteId) {
    return new Response("ID manquant", { status: 400 });
  }

  // Cherche le devis
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true, client: true },
  });
  if (!quote) {
    return new Response("Devis introuvable", { status: 404 });
  }

  // Vérifie si le PDF existe déjà (champ `pdfUrl`)
  if (quote.pdfUrl) {
    // Redirection directe
    return Response.redirect(quote.pdfUrl, 302);
  }

  // Génère le HTML (personnalise ici aussi)
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

  // Génère le PDF
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  // Upload du PDF sur Supabase Storage
  const filename = `devis/${quote.number}-${uuidv4()}.pdf`;
  const { data, error } = await supabase.storage
    .from("quotes")
    .upload(filename, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    return new Response("Erreur upload Supabase: " + error.message, { status: 500 });
  }

  // Génère l’URL publique
  const pdfUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/quotes/${filename}`;

  // Mets à jour le devis avec l’URL du PDF
  await prisma.quote.update({
    where: { id: quoteId },
    data: { pdfUrl },
  });

  // Redirige vers le PDF hébergé
  return Response.redirect(pdfUrl, 302);
}
