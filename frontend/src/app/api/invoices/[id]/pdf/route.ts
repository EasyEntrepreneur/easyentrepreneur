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
  const invoiceId = params.id;
  if (!invoiceId) {
    return new Response("ID manquant", { status: 400 });
  }

  // Cherche la facture
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true, client: true },
  });
  if (!invoice) {
    return new Response("Facture introuvable", { status: 404 });
  }

  // Vérifie si le PDF existe déjà (champ `pdfUrl` en base)
  if (invoice.pdfUrl) {
    // On renvoie direct le PDF existant (redirection 302)
    return Response.redirect(invoice.pdfUrl, 302);
  }

  // Génère le HTML (utilise ta logique custom ici)
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

  // Génère le PDF avec Puppeteer
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  // Upload du PDF sur Supabase Storage
  const filename = `factures/${invoice.number}-${uuidv4()}.pdf`;
  const { data, error } = await supabase.storage
    .from("invoices")
    .upload(filename, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    return new Response("Erreur upload Supabase: " + error.message, { status: 500 });
  }

  // Génère l’URL publique
  const pdfUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/invoices/${filename}`;

  // Mets à jour la facture avec l’URL du PDF (en base)
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { pdfUrl },
  });

  // Redirige vers le PDF hébergé
  return Response.redirect(pdfUrl, 302);
}
