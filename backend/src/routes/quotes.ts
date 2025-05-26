import { Router } from 'express'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middlewares/authenticateToken'
import { checkDocumentQuota } from '../middlewares/checkDocumentQuota'
import path from 'path'
import fs from 'fs/promises'
import PDFDocument from 'pdfkit'
import * as fsSync from 'fs';

const router = Router()

// Suppression d'un devis (avec contrôle utilisateur)
router.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const quoteId = req.params.id
  try {
    await prisma.quoteItem.deleteMany({ where: { quoteId } })
    const result = await prisma.quote.deleteMany({ where: { id: quoteId, userId } })
    if (result.count === 0) {
      return res.status(404).json({ error: "Devis introuvable ou accès refusé." })
    }
    res.json({ success: true, id: quoteId })
  } catch (error) {
    console.error("[DELETE] Erreur suppression devis :", error)
    res.status(500).json({ error: "Erreur lors de la suppression du devis." })
  }
})

// Suppression groupée de devis
router.post('/bulk-delete', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Aucun devis sélectionné" })
  }
  try {
    await prisma.quoteItem.deleteMany({ where: { quoteId: { in: ids } } })
    const result = await prisma.quote.deleteMany({ where: { id: { in: ids }, userId } })
    if (result.count === 0) {
      return res.status(404).json({ error: "Aucun devis supprimé (non trouvé ou accès refusé)." })
    }
    res.json({ deleted: result.count, ids })
  } catch (error) {
    console.error("[BULK DELETE] Erreur suppression devis :", error)
    res.status(500).json({ error: "Erreur lors de la suppression des devis." })
  }
})

// GET /quotes — tous les devis du user connecté
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  try {
    const quotes = await prisma.quote.findMany({
      where: { userId },
      include: { items: true, client: true },
      orderBy: { issuedAt: 'desc' }
    })
    const quotesWithPdfUrl = quotes.map((q: any) => ({
      ...q,
      pdfUrl: q.number ? `/quotes/${q.number}.pdf` : null
    }))
    res.json(quotesWithPdfUrl)
  } catch (error) {
    console.error('Erreur GET /quotes :', error)
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des devis.' })
  }
})

// GET /quotes/:id — un devis spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const quoteId = req.params.id
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, userId },
      include: { items: true, client: true }
    })
    if (!quote) {
      return res.status(404).json({ error: 'Devis introuvable.' })
    }
    res.json({
      ...quote,
      pdfUrl: quote.number ? `/quotes/${quote.number}.pdf` : null
    })
  } catch (error) {
    console.error('Erreur GET /quotes/:id :', error)
    res.status(500).json({ error: 'Erreur serveur lors de la récupération du devis.' })
  }
})

const LIGHT_BLUE = "#E3F0FF"; // Bleu clair

function formatEuro(val: number) {
  return val.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function generateQuotePdf(quote: any, pdfPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const stream = fsSync.createWriteStream(pdfPath);
      doc.pipe(stream);

      // --- Client à gauche
      doc.font('Helvetica-Bold').fontSize(11).text(quote.clientName, 40, 40);
      doc.font('Helvetica').fontSize(10)
        .text(quote.clientAddress, 40, 55)
        .text(`${quote.clientZip || ''} ${quote.clientCity || ''}`, 40, 70)
      if (quote.clientSiret) doc.font('Helvetica-Bold').text('Siret :', 40, 85, { continued: true }).font('Helvetica').text(quote.clientSiret || '', undefined, undefined);

      // Prestataire à droite (remplace ces champs par les tiens si besoin)
      const rightX = 320;
      doc.font('Helvetica-Bold').fontSize(11).text(quote.providerName || "Votre entreprise", rightX, 40);
      doc.font('Helvetica').fontSize(10)
        .text(quote.providerAddress || "Adresse prestataire", rightX, 55)
        .text(quote.providerZip && quote.providerCity ? `${quote.providerZip} ${quote.providerCity}` : '', rightX, 70)
      if (quote.providerSiret)
        doc.font('Helvetica-Bold').text('Siret :', rightX, 85, { continued: true }).font('Helvetica').text(quote.providerSiret, undefined, undefined);

      // Numéro du devis (titre centré)
      doc.font('Helvetica').fontSize(12).text(`Devis N°${quote.number || ''}`, 0, 40, { align: 'center' });

      // --- Date du devis (bandeau bleu clair)
      doc.rect(40, 120, 515, 28).fill(LIGHT_BLUE).stroke();
      doc.fillColor('#222').font('Helvetica-Bold').fontSize(10).text('Date du devis', 50, 128);
      doc.font('Helvetica').text(quote.issuedAt ? new Date(quote.issuedAt).toLocaleDateString('fr-FR') : '', 160, 128);

      // --- Tableau des prestations
      const tableY = 170;
      doc.fillColor(LIGHT_BLUE).rect(40, tableY, 515, 26).fill();
      doc.fillColor('#222');
      doc.font('Helvetica-Bold').fontSize(10)
        .text('Description', 45, tableY + 8)
        .text('Quantité', 295, tableY + 8, { width: 60, align: 'right' })
        .text('Prix unitaire HT', 360, tableY + 8, { width: 90, align: 'right' })
        .text('Prix total HT', 455, tableY + 8, { width: 90, align: 'right' });

      let y = tableY + 26;
      quote.items.forEach((item: any, i: number) => {
        doc.fillColor(i % 2 ? "#fff" : "#f5f7fa"); // Alternance
        doc.rect(40, y, 515, 26).fill();
        doc.fillColor('#222');
        doc.font('Helvetica-Bold').fontSize(10).text(item.description, 45, y + 3, { width: 220 });
        if (item.longDescription) {
          doc.font('Helvetica').fontSize(9).text(item.longDescription, 45, y + 16, { width: 220 });
        }
        doc.font('Helvetica').fontSize(10)
          .text(item.quantity, 295, y + 3, { width: 60, align: 'right' })
          .text(formatEuro(item.unitPrice), 360, y + 3, { width: 90, align: 'right' })
          .text(formatEuro(item.totalHT), 455, y + 3, { width: 90, align: 'right' });
        y += 26;
      });

      // --- Total HT (case bleue à droite)
      y += 10;
      doc.fillColor(LIGHT_BLUE).rect(360, y, 195, 24).fill();
      doc.fillColor('#222');
      doc.font('Helvetica-Bold').text('Total HT', 365, y + 7);
      doc.font('Helvetica').text(formatEuro(quote.totalHT), 500, y + 7, { align: 'right', width: 50 });

      // --- Mention en bas centré
      doc.fontSize(10).fillColor('#555').text("TVA non applicable, art. 293B du CGI", 0, y + 40, { align: 'center' });

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

// POST /quotes — création d'un devis + PDF
router.post('/', authenticateToken, checkDocumentQuota, async (req, res) => {
  const userId = req.user.userId
  const {
    client,
    validUntil,
    items,
    quoteHtml, // ignoré (pas utile pour PDFKit)
    ...rest
  } = req.body

  try {
    // 1. Client existant ou à créer
    let dbClient = null
    if (client.siret) {
      dbClient = await prisma.client.findFirst({ where: { userId, siret: client.siret } })
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
      })
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
      }
      dbClient = await prisma.client.create({ data: clientToInsert })
    }

    // 2. Génération numéro unique pour le devis (par année)
    const year = new Date().getFullYear()
    const regex = new RegExp(`^${year}-(\\d{3})$`)
    const quotesThisYear = await prisma.quote.findMany({
      where: { userId, number: { startsWith: `${year}-` } },
      select: { number: true }
    })
    let nextNumber = 1
    if (quotesThisYear.length > 0) {
      const nums = quotesThisYear
        .map((q: any) => {
          const match = q.number.match(regex)
          return match ? parseInt(match[1], 10) : 0
        })
        .filter((n: number) => !isNaN(n))
      if (nums.length > 0) {
        nextNumber = Math.max(...nums) + 1
      }
    }
    let number = `${year}-${String(nextNumber).padStart(3, '0')}`

    let exists = await prisma.quote.findUnique({ where: { number } })
    let tries = 0
    const maxTries = 10
    while (exists && tries < maxTries) {
      nextNumber++
      number = `${year}-${String(nextNumber).padStart(3, '0')}`
      exists = await prisma.quote.findUnique({ where: { number } })
      if (!exists) break
      tries++
    }
    if (tries === maxTries && exists) {
      return res.status(500).json({ error: "Impossible de générer un numéro de devis unique. Veuillez réessayer." })
    }

    // 3. Calcul totaux
    let totalHT = 0
    let totalTVA = 0
    let totalTTC = 0
    const quoteItems = items.map((item: any) => {
      const ht = item.unitPrice * item.quantity
      const tva = ht * (item.vatRate / 100)
      const ttc = ht + tva
      totalHT += ht
      totalTVA += tva
      totalTTC += ttc
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        totalHT: ht,
        totalTVA: tva,
        totalTTC: ttc,
      }
    })

    // 4. Création du devis en base
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
    })

    // 5. Génération du PDF avec PDFKit
    const pdfDir = path.join(__dirname, "../../quotes_pdf")
    await fs.mkdir(pdfDir, { recursive: true })
    const pdfFilename = `${newQuote.number}.pdf`
    const pdfPath = path.join(pdfDir, pdfFilename)
    await generateQuotePdf(newQuote, pdfPath)

    // MAJ chemin PDF en base
    newQuote = await prisma.quote.update({
      where: { id: newQuote.id },
      data: { pdfPath: pdfFilename },
      include: { items: true, client: true },
    })

    res.status(201).json({
      ...newQuote,
      pdfUrl: `/quotes/${newQuote.number}.pdf`
    })
  } catch (error) {
    console.error('Erreur POST /quotes :', error)
    res.status(500).json({ error: 'Erreur serveur lors de la création du devis.' })
  }
})

// PATCH /quotes/:id/statut — Changer le statut du devis
router.patch('/:id/statut', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const quoteId = req.params.id
  const { statut } = req.body
  const allowedStatuts = ["ACCEPTE", "EN_ATTENTE", "REFUSE"]
  if (!allowedStatuts.includes(statut)) {
    return res.status(400).json({ error: "Statut invalide" })
  }
  try {
    const quote = await prisma.quote.update({
      where: { id: quoteId, userId },
      data: { statut },
    })
    if (!quote) return res.status(404).json({ error: "Devis introuvable" })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" })
  }
})

// GET /quotes/:number/pdf — Télécharge le PDF du devis par numéro
router.get('/:number/pdf', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const quoteNumber = req.params.number

  const quote = await prisma.quote.findFirst({
    where: { number: quoteNumber, userId }
  })

  if (!quote || !quote.pdfPath) {
    return res.status(404).json({ error: "PDF non trouvé" })
  }

  const pdfFilePath = path.join(__dirname, "../../quotes_pdf", quote.pdfPath)
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `inline; filename="Devis-${quote.number}.pdf"`)
  res.sendFile(path.resolve(pdfFilePath))
})

export default router
