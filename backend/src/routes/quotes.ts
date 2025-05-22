import { Router } from 'express'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middlewares/authenticateToken'
import { checkDocumentQuota } from '../middlewares/checkDocumentQuota'
import path from 'path'
import fs from 'fs/promises'
import puppeteer from 'puppeteer'

const router = Router()

// Suppression d'un devis (avec contrôle utilisateur)
router.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const quoteId = req.params.id;
  try {
    // 1. Supprime tous les items du devis
    await prisma.quoteItem.deleteMany({
      where: { quoteId }
    });
    // 2. Supprime le devis SEULEMENT si il appartient au user
    const result = await prisma.quote.deleteMany({
      where: { id: quoteId, userId }
    });
    if (result.count === 0) {
      return res.status(404).json({ error: "Devis introuvable ou accès refusé." });
    }
    res.json({ success: true, id: quoteId });
  } catch (error) {
    console.error("[DELETE] Erreur suppression devis :", error);
    res.status(500).json({ error: "Erreur lors de la suppression du devis." });
  }
});

// Suppression groupée de devis
router.post('/bulk-delete', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Aucun devis sélectionné" });
  }
  try {
    await prisma.quoteItem.deleteMany({
      where: { quoteId: { in: ids } }
    });
    const result = await prisma.quote.deleteMany({
      where: { id: { in: ids }, userId }
    });
    if (result.count === 0) {
      return res.status(404).json({ error: "Aucun devis supprimé (non trouvé ou accès refusé)." });
    }
    res.json({ deleted: result.count, ids });
  } catch (error) {
    console.error("[BULK DELETE] Erreur suppression devis :", error);
    res.status(500).json({ error: "Erreur lors de la suppression des devis." });
  }
});

// GET /quotes — tous les devis du user connecté
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  try {
    const quotes = await prisma.quote.findMany({
      where: { userId },
      include: { items: true, client: true },
      orderBy: { issuedAt: 'desc' },
    });
    // Ajoute le champ pdfUrl pour chaque devis
    const quotesWithPdfUrl = quotes.map((q: any) => ({
      ...q,
      pdfUrl: q.number ? `/quotes/${q.number}.pdf` : null
    }));
    res.json(quotesWithPdfUrl);
  } catch (error) {
    console.error('Erreur GET /quotes :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des devis.' });
  }
});

// GET /quotes/:id — un devis spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const quoteId = req.params.id;
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, userId },
      include: { items: true, client: true },
    });
    if (!quote) {
      return res.status(404).json({ error: 'Devis introuvable.' });
    }
    res.json({
      ...quote,
      pdfUrl: quote.number ? `/quotes/${quote.number}.pdf` : null
    });
  } catch (error) {
    console.error('Erreur GET /quotes/:id :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du devis.' });
  }
});

// --- Génération HTML fallback côté back (optionnel)
function generateQuoteHtml(quote: any) {
  return `
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #444; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px;}
          th, td { border: 1px solid #aaa; padding: 8px; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h1>Devis ${quote.number}</h1>
        <div>
          <b>Client :</b> ${quote.clientName} <br>
          ${quote.clientAddress} <br>
          ${quote.clientZip} ${quote.clientCity}
        </div>
        <div style="margin-top:10px;">
          <b>Date :</b> ${quote.issuedAt?.toLocaleDateString ? quote.issuedAt.toLocaleDateString() : quote.issuedAt}
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantité</th>
              <th>Prix unitaire</th>
              <th>Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${
              quote.items
                .map(
                  (it: any) => `<tr>
                    <td>${it.description}</td>
                    <td class="right">${it.quantity}</td>
                    <td class="right">${it.unitPrice.toFixed(2)} €</td>
                    <td class="right">${it.totalHT.toFixed(2)} €</td>
                  </tr>`
                )
                .join("")
            }
          </tbody>
        </table>
        <div class="right" style="margin-top:24px;">
          <b>Total HT : </b>${quote.totalHT.toFixed(2)} €<br>
          <b>TVA : </b>${quote.totalTVA.toFixed(2)} €<br>
          <b>Total TTC : </b>${quote.totalTTC.toFixed(2)} €
        </div>
        <div style="margin-top:24px; font-size:12px;">${quote.notes || ""}</div>
      </body>
    </html>
  `;
}

// POST /quotes — création d'un devis
router.post('/', authenticateToken, checkDocumentQuota, async (req, res) => {
  const userId = req.user.userId;
  const {
    client,
    validUntil,
    items,
    quoteHtml,
    ...rest
  } = req.body;

  try {
    // 1. Récupère ou crée le client
    let dbClient = null;
    if (client.siret) {
      dbClient = await prisma.client.findFirst({
        where: { userId, siret: client.siret }
      });
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

    // 2. Génération numéro unique pour le devis (par année)
    const year = new Date().getFullYear();
    const regex = new RegExp(`^${year}-(\\d{3})$`);
    const quotesThisYear = await prisma.quote.findMany({
      where: {
        userId,
        number: { startsWith: `${year}-` }
      },
      select: { number: true }
    });
    let nextNumber = 1;
    if (quotesThisYear.length > 0) {
      const nums = quotesThisYear
        .map(q => {
          const match = q.number.match(regex);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => !isNaN(n));
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
      return res.status(500).json({ error: "Impossible de générer un numéro de devis unique. Veuillez réessayer." });
    }

    // 3. Calcul des totaux (identique à invoice)
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
      }
    });

    // 4. Création du devis
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
      },
      include: { items: true, client: true },
    });

    // 5. Génération PDF
    const htmlToUse = quoteHtml || generateQuoteHtml(newQuote);
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(htmlToUse, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    const pdfDir = path.join(__dirname, "../../quotes_pdf");
    await fs.mkdir(pdfDir, { recursive: true });
    const pdfFilename = `${newQuote.number}.pdf`;
    const pdfPath = path.join(pdfDir, pdfFilename);
    await fs.writeFile(pdfPath, pdfBuffer);

    // Met à jour le devis avec le PDF
    newQuote = await prisma.quote.update({
      where: { id: newQuote.id },
      data: { pdfPath: pdfFilename },
      include: { items: true, client: true },
    });

    res.status(201).json({
      ...newQuote,
      pdfUrl: `/quotes/${newQuote.number}.pdf`
    });
  } catch (error) {
    console.error('Erreur POST /quotes :', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du devis.' });
  }
});

// PATCH /quotes/:id/statut — Changer le statut du devis
router.patch('/:id/statut', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const quoteId = req.params.id;
  const { statut } = req.body;
  const allowedStatuts = ["ACCEPTE", "EN_ATTENTE", "REFUSE"];
  if (!allowedStatuts.includes(statut)) {
    return res.status(400).json({ error: "Statut invalide" });
  }
  try {
    const quote = await prisma.quote.update({
      where: { id: quoteId, userId },
      data: { statut },
    });
    if (!quote) return res.status(404).json({ error: "Devis introuvable" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /quotes/:number/pdf — Télécharge le PDF du devis par numéro
router.get('/:number/pdf', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const quoteNumber = req.params.number;

  const quote = await prisma.quote.findFirst({
    where: { number: quoteNumber, userId }
  });

  if (!quote || !quote.pdfPath) {
    return res.status(404).json({ error: "PDF non trouvé" });
  }

  const pdfFilePath = path.join(__dirname, "../../quotes_pdf", quote.pdfPath);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="Devis-${quote.number}.pdf"`);
  res.sendFile(path.resolve(pdfFilePath));
});

export default router;
