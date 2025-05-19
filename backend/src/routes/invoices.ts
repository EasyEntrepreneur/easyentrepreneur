import { Router } from 'express'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middlewares/authenticateToken'
import path from 'path'
import fs from 'fs/promises'
import puppeteer from 'puppeteer'

const router = Router()

// GET /invoices — toutes les factures du user connecté
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: { items: true, client: true },
      orderBy: { issuedAt: 'desc' },
    })
    // Ajoute le champ pdfUrl pour chaque facture (utilisé côté front)
    const invoicesWithPdfUrl = invoices.map((inv: { number: any }) => ({
      ...inv,
      pdfUrl: inv.number ? `/invoices/${inv.number}.pdf` : null
    }))
    res.json(invoicesWithPdfUrl)
  } catch (error) {
    console.error('Erreur GET /invoices :', error)
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des factures.' })
  }
})

// GET /invoices/:id — une facture spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const invoiceId = req.params.id
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { items: true, client: true },
    })
    if (!invoice) {
      return res.status(404).json({ error: 'Facture introuvable.' })
    }
    // Ajoute le champ pdfUrl pour le front
    res.json({
      ...invoice,
      pdfUrl: invoice.number ? `/invoices/${invoice.number}.pdf` : null
    })
  } catch (error) {
    console.error('Erreur GET /invoices/:id :', error)
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de la facture.' })
  }
})

// --- UTILITY : Optionnel, fallback de génération HTML côté back (pour tests)
function generateInvoiceHtml(invoice: any) {
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
        <h1>Facture ${invoice.number}</h1>
        <div>
          <b>Client :</b> ${invoice.clientName} <br>
          ${invoice.clientAddress} <br>
          ${invoice.clientZip} ${invoice.clientCity}
        </div>
        <div style="margin-top:10px;">
          <b>Date :</b> ${invoice.issuedAt?.toLocaleDateString ? invoice.issuedAt.toLocaleDateString() : invoice.issuedAt}
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
              invoice.items
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
          <b>Total HT : </b>${invoice.totalHT.toFixed(2)} €<br>
          <b>TVA : </b>${invoice.totalTVA.toFixed(2)} €<br>
          <b>Total TTC : </b>${invoice.totalTTC.toFixed(2)} €
        </div>
        <div style="margin-top:24px; font-size:12px;">${invoice.legalNote || ""}</div>
      </body>
    </html>
  `
}

// POST /invoices — création d’une facture et génération PDF
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const {
    client,
    dueAt,
    iban,
    bic,
    items,
    invoiceHtml,
    ...rest
  } = req.body

  try {
    // 1. Récupère ou crée le client
    let dbClient = null
    if (client.siret) {
      dbClient = await prisma.client.findFirst({
        where: { userId, siret: client.siret }
      })
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

    // Générer un numéro de facture
    const lastInvoice = await prisma.invoice.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    let nextNumber = 1
    if (lastInvoice?.number) {
      const match = lastInvoice.number.match(/(\d+)$/)
      if (match) nextNumber = parseInt(match[1]) + 1
    }
    const number = `2024-${String(nextNumber).padStart(3, '0')}`

    // Calcul des totaux
    let totalHT = 0
    let totalTVA = 0
    let totalTTC = 0
    const invoiceItems = items.map((item: any) => {
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

    // Création en base
    let newInvoice = await prisma.invoice.create({
      data: {
        number,
        userId,
        statut: "EN_ATTENTE", // ← ENUM ici !
        clientId: dbClient.id,
        clientName: client.name,
        clientAddress: client.address,
        clientZip: client.zip,
        clientCity: client.city,
        clientEmail: client.email,
        clientPhone: client.phone,
        dueAt: dueAt ? new Date(dueAt) : undefined,
        iban,
        bic,
        totalHT,
        totalTVA,
        totalTTC,
        items: { createMany: { data: invoiceItems } },
      },
      include: { items: true, client: true },
    })

    // Génération du PDF avec le HTML reçu du front (ou fallback)
    const htmlToUse = invoiceHtml || generateInvoiceHtml(newInvoice)
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.setContent(htmlToUse, { waitUntil: "networkidle0" })
    const pdfBuffer = await page.pdf({ format: "A4" })
    await browser.close()

    // Sauvegarde le PDF dans /invoices_pdf/
    const pdfDir = path.join(__dirname, "../../invoices_pdf")
    await fs.mkdir(pdfDir, { recursive: true })
    const pdfFilename = `${newInvoice.number}.pdf`
    const pdfPath = path.join(pdfDir, pdfFilename)
    await fs.writeFile(pdfPath, pdfBuffer)
    const pdfUrl = `/invoices/${newInvoice.number}.pdf`;
    
    // Met à jour la facture avec juste le NOM DU FICHIER PDF (pas le chemin complet !)
    newInvoice = await prisma.invoice.update({
      where: { id: newInvoice.id },
      data: { pdfPath: pdfFilename }, // <-- Juste le nom, ex: 2024-031.pdf
      include: { items: true, client: true },
    })

    // Retourne la facture + l’URL web du PDF
    res.status(201).json({
      ...newInvoice,
      pdfUrl: `/invoices/${newInvoice.number}.pdf`
    })
  } catch (error) {
    console.error('Erreur POST /invoices :', error)
    res.status(500).json({ error: 'Erreur serveur lors de la création de la facture.' })
  }
})

// PATCH /invoices/:id/statut — Changer le statut de la facture
router.patch('/:id/statut', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const invoiceId = req.params.id
  const { statut } = req.body
  // On ne valide QUE les valeurs enum
  const allowedStatuts = ["PAYEE", "EN_ATTENTE", "ANNULE"];
  if (!allowedStatuts.includes(statut)) {
    return res.status(400).json({ error: "Statut invalide" })
  }
  try {
    const invoice = await prisma.invoice.update({
      where: { id: invoiceId, userId },
      data: { statut },
    })
    if (!invoice) return res.status(404).json({ error: "Facture introuvable" })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" })
  }
})

// GET /invoices/number/:number/pdf — Télécharge le PDF par numéro (ex: 2024-043)
router.get('/:id/pdf', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const invoiceNumber = req.params.id // c'est bien le NUMERO de facture ici (ex: 2024-045)

  // Cherche la facture par number et userId
  const invoice = await prisma.invoice.findFirst({
    where: { number: invoiceNumber, userId }
  })

  if (!invoice || !invoice.pdfPath) {
    return res.status(404).json({ error: "PDF non trouvé" })
  }

  const pdfFilePath = path.join(__dirname, "../../invoices_pdf", invoice.pdfPath)
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `inline; filename="Facture-${invoice.number}.pdf"`)
  res.sendFile(path.resolve(pdfFilePath))
})

export default router
