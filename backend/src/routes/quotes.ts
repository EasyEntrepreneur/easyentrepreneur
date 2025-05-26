import { Router } from 'express'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middlewares/authenticateToken'
import { checkDocumentQuota } from '../middlewares/checkDocumentQuota'
import path from 'path'
import fs from 'fs/promises'
import PDFDocument from 'pdfkit'
import fsSync from 'fs'

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

// Génération PDF avec PDFKit pour un devis
function generateQuotePdf(quote: any, pdfPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const writeStream = fsSync.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      // Header : LOGO/TITRE
      doc.fontSize(20).font('Helvetica-Bold').text('DEVIS', 40, 40, { align: 'left' });
      doc.fontSize(10).font('Helvetica').text(`N° ${quote.number}`, 40, 65, { align: 'left' });

      // Infos émetteur (à GAUCHE)
      doc.fontSize(11).font('Helvetica-Bold').text('Émetteur :', 40, 100);
      doc.font('Helvetica').fontSize(10)
        .text('EasyEntrepreneur', 40, 115)
        .text('Adresse émetteur', 40, 130)
        .text('Email', 40, 145)
        .text('Téléphone', 40, 160);

      // Infos client (à DROITE)
      doc.fontSize(11).font('Helvetica-Bold').text('Client :', 350, 100);
      doc.font('Helvetica').fontSize(10)
        .text(quote.clientName, 350, 115)
        .text(quote.clientAddress, 350, 130)
        .text(`${quote.clientZip} ${quote.clientCity}`, 350, 145)
        .text(quote.clientEmail || '', 350, 160)
        .text(quote.clientPhone || '', 350, 175);

      // Date validité (centré sous header)
      doc.fontSize(11).text(
        `Émis le : ${quote.issuedAt ? new Date(quote.issuedAt).toLocaleDateString() : ''}` +
        (quote.validUntil ? ` | Valide jusqu'au : ${new Date(quote.validUntil).toLocaleDateString()}` : ''),
        0, 195, { align: 'center' }
      );

      // Tableau des prestations
      const tableTop = 220;
      doc.moveTo(40, tableTop).lineTo(555, tableTop).stroke();
      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Description', 45, tableTop + 5, { width: 200 });
      doc.text('Qté', 255, tableTop + 5, { width: 40, align: 'right' });
      doc.text('PU HT', 310, tableTop + 5, { width: 60, align: 'right' });
      doc.text('TVA', 375, tableTop + 5, { width: 50, align: 'right' });
      doc.text('Total HT', 440, tableTop + 5, { width: 80, align: 'right' });
      doc.font('Helvetica');
      doc.moveTo(40, tableTop + 23).lineTo(555, tableTop + 23).stroke();

      // Lignes du tableau
      let y = tableTop + 30;
      quote.items.forEach((item: any) => {
        doc.text(item.description, 45, y, { width: 200 });
        doc.text(item.quantity, 255, y, { width: 40, align: 'right' });
        doc.text(item.unitPrice.toFixed(2) + ' €', 310, y, { width: 60, align: 'right' });
        doc.text((item.vatRate || 0).toFixed(2) + ' %', 375, y, { width: 50, align: 'right' });
        doc.text(item.totalHT.toFixed(2) + ' €', 440, y, { width: 80, align: 'right' });
        y += 20;
      });

      // Totaux
      y += 10;
      doc.font('Helvetica-Bold').text('Total HT :', 375, y, { width: 80, align: 'right' });
      doc.font('Helvetica').text(quote.totalHT.toFixed(2) + ' €', 460, y, { width: 60, align: 'right' });
      y += 15;
      doc.font('Helvetica-Bold').text('TVA :', 375, y, { width: 80, align: 'right' });
      doc.font('Helvetica').text(quote.totalTVA.toFixed(2) + ' €', 460, y, { width: 60, align: 'right' });
      y += 15;
      doc.font('Helvetica-Bold').text('Total TTC :', 375, y, { width: 80, align: 'right' });
      doc.font('Helvetica').text(quote.totalTTC.toFixed(2) + ' €', 460, y, { width: 60, align: 'right' });

      // Notes (en bas centré)
      if (quote.notes) {
        doc.font('Helvetica').fontSize(10).text(quote.notes, 40, y + 40, { align: 'center', width: 515 });
      }

      doc.end();
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
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
