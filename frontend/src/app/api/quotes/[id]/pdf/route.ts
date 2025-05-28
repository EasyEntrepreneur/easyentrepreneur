import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import prisma from "@/lib/prisma";
import { supabase } from "@/lib/supabaseAdmin";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/");
  const quoteId = parts[parts.length - 2];
  if (!quoteId || quoteId === "pdf") {
    return new Response("ID manquant", { status: 400 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { items: true, client: true },
  });
  if (!quote) {
    return new Response("Devis introuvable", { status: 404 });
  }

  if (quote.pdfUrl) {
    return Response.redirect(quote.pdfUrl, 302);
  }

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

  const filename = `devis/${quote.number}-${uuidv4()}.pdf`;
  const { error } = await supabase.storage
    .from("pdfs")
    .upload(filename, pdfBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    return new Response("Erreur upload Supabase: " + error.message, { status: 500 });
  }

  const pdfUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/pdfs/${filename}`;

  await prisma.quote.update({
    where: { id: quoteId },
    data: { pdfUrl },
  });

  return Response.redirect(pdfUrl, 302);
}
