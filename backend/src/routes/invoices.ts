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
    res.json(invoices)
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
    res.json(invoice)
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
          th { background: #eee; }
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

// POST /invoices — création d’une facture et création/lien du client + génération PDF
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const {
    client,
    dueAt,
    iban,
    bic,
    items,
    invoiceHtml, // <-- HTML côté front à utiliser pour le PDF
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

    // Création en base (SANS HTML reçu dans Prisma !)
    let newInvoice = await prisma.invoice.create({
      data: {
        number,
        userId,
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


    // Génération du PDF avec le HTML reçu du front
    // (fallback : utilise generateInvoiceHtml si jamais invoiceHtml est vide)
    const htmlToUse = invoiceHtml || generateInvoiceHtml(newInvoice)
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.setContent(htmlToUse, { waitUntil: "networkidle0" })
    const pdfBuffer = await page.pdf({ format: "A4" })
    await browser.close()

    // Sauvegarde le PDF dans /invoices_pdf/
    const pdfDir = path.join(__dirname, "../../invoices_pdf")
    await fs.mkdir(pdfDir, { recursive: true })
    const pdfPath = path.join(pdfDir, `${newInvoice.number}.pdf`)
    await fs.writeFile(pdfPath, pdfBuffer)

    // Met à jour la facture avec le chemin du PDF
    newInvoice = await prisma.invoice.update({
      where: { id: newInvoice.id },
      data: { pdfPath },
      include: { items: true, client: true },
    })

    res.status(201).json(newInvoice)
  } catch (error) {
    console.error('Erreur POST /invoices :', error)
    res.status(500).json({ error: 'Erreur serveur lors de la création de la facture.' })
  }
})

// GET /invoices/:id/pdf — Télécharge le PDF
router.get('/:id/pdf', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const invoiceId = req.params.id

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId }
  })

  if (!invoice || !invoice.pdfPath) {
    return res.status(404).json({ error: "PDF non trouvé" })
  }

  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `inline; filename="Facture-${invoice.number}.pdf"`)
  res.sendFile(path.resolve(invoice.pdfPath))
})

export default router
