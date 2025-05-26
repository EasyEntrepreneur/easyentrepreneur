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
      const doc = new PDFDocument({ size: 'A4', margin: 50 })
      const writeStream = fsSync.createWriteStream(pdfPath)
      doc.pipe(writeStream)

      // Header
      doc.fontSize(22).text(`Devis ${quote.number}`, { align: 'right' })
      doc.moveDown()
      doc.fontSize(10)
        .text(`Date : ${quote.issuedAt ? new Date(quote.issuedAt).toLocaleDateString() : ''}`, { align: 'right' })
      doc.moveDown()
      doc.fontSize(14).text('Client :')
      doc.fontSize(10)
        .text(`${quote.clientName}`)
        .text(`${quote.clientAddress}`)
        .text(`${quote.clientZip} ${quote.clientCity}`)
      doc.moveDown()

      // Table
      doc.fontSize(12).text('Prestations', { underline: true })
      doc.moveDown(0.3)
      // Table Header
      doc.font('Helvetica-Bold')
        .text('Description', 50, doc.y, { continued: true, width: 200 })
        .text('Quantité', 260, doc.y, { continued: true, width: 70, align: 'right' })
        .text('Prix unit.', 340, doc.y, { continued: true, width: 70, align: 'right' })
        .text('Total HT', 420, doc.y, { align: 'right' })
      doc.font('Helvetica')
      doc.moveDown(0.3)
      quote.items.forEach((item: any) => {
        doc.text(item.description, 50, doc.y, { continued: true, width: 200 })
          .text(item.quantity, 260, doc.y, { continued: true, width: 70, align: 'right' })
          .text(item.unitPrice.toFixed(2) + ' €', 340, doc.y, { continued: true, width: 70, align: 'right' })
          .text(item.totalHT.toFixed(2) + ' €', 420, doc.y, { align: 'right' })
        doc.moveDown(0.2)
      })
      doc.moveDown()

      // Totaux
      doc.fontSize(12)
        .text(`Total HT : ${quote.totalHT.toFixed(2)} €`, { align: 'right' })
        .text(`TVA : ${quote.totalTVA.toFixed(2)} €`, { align: 'right' })
        .text(`Total TTC : ${quote.totalTTC.toFixed(2)} €`, { align: 'right' })
      doc.moveDown()

      // Notes/validité
      doc.fontSize(10)
      if (quote.notes) doc.text(quote.notes, { align: 'center' })
      if (quote.validUntil) doc.text(`Valable jusqu'au : ${new Date(quote.validUntil).toLocaleDateString()}`)

      doc.end()

      writeStream.on('finish', () => resolve())
      writeStream.on('error', reject)
    } catch (err) {
      reject(err)
    }
  })
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
