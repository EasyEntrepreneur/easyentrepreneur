import { Router } from 'express'
import prisma from '@/lib/prisma';
import { authenticateToken } from '../../../../backend/src/middlewares/authenticateToken'
import { checkDocumentQuota } from '../../../../backend/src/middlewares/checkDocumentQuota'
import path from 'path'
import fs from 'fs/promises'
import * as fsSync from 'fs'
import puppeteer from 'puppeteer'

const router = Router()

// Suppression d'une facture (avec contrôle utilisateur)
router.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const invoiceId = req.params.id
  try {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId } })
    const result = await prisma.invoice.deleteMany({ where: { id: invoiceId, userId } })
    if (result.count === 0) {
      return res.status(404).json({ error: "Facture introuvable ou accès refusé." })
    }
    res.json({ success: true, id: invoiceId })
  } catch (error) {
    console.error("[DELETE] Erreur suppression facture :", error)
    res.status(500).json({ error: "Erreur lors de la suppression de la facture." })
  }
})

// Suppression groupée de factures
router.post('/bulk-delete', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const { ids } = req.body
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Aucune facture sélectionnée" })
  }
  try {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: ids } } })
    const result = await prisma.invoice.deleteMany({ where: { id: { in: ids }, userId } })
    if (result.count === 0) {
      return res.status(404).json({ error: "Aucune facture supprimée (non trouvée ou accès refusé)." })
    }
    res.json({ deleted: result.count, ids })
  } catch (error) {
    console.error("[BULK DELETE] Erreur suppression factures :", error)
    res.status(500).json({ error: "Erreur lors de la suppression des factures." })
  }
})

// GET /invoices — toutes les factures du user connecté
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: { items: true, client: true },
      orderBy: { issuedAt: 'desc' }
    })
    const invoicesWithPdfUrl = invoices.map((inv: any) => ({
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
      include: { items: true, client: true }
    })
    if (!invoice) {
      return res.status(404).json({ error: 'Facture introuvable.' })
    }
    res.json({
      ...invoice,
      pdfUrl: invoice.number ? `/invoices/${invoice.number}.pdf` : null
    })
  } catch (error) {
    console.error('Erreur GET /invoices/:id :', error)
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de la facture.' })
  }
})

// Génération PDF AVEC PUPPETEER
async function generateInvoicePdfWithPuppeteer(invoiceHtml: string, pdfPath: string) {
  function getChromePath() {
    if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
    // Chemin Render
    const chromeCache = '/opt/render/.cache/puppeteer/chrome';
    if (fsSync.existsSync(chromeCache)) {
      const dirs = fsSync.readdirSync(chromeCache).sort().reverse();
      for (const dir of dirs) {
        const chromePath = path.join(chromeCache, dir, 'chrome-linux64', 'chrome');
        if (fsSync.existsSync(chromePath)) return chromePath;
      }
    }
    // Par défaut : laisse faire Puppeteer (utile pour développement local)
    return undefined;
  }

  const chromePath = getChromePath();
  if (!chromePath) {
    throw new Error(
      "Aucune exécutable Chrome trouvé sur le serveur !\n" +
      "=> Vérifie que le script 'postinstall' de puppeteer est bien exécuté.\n" +
      "=> Vérifie les logs Render pour d’éventuelles erreurs d’installation."
    );
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
    executablePath: chromePath,
  });
  const page = await browser.newPage();
  await page.setContent(invoiceHtml, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '30px', bottom: '30px', left: '20px', right: '20px' }
  });
  await browser.close();
}

// POST /invoices — création facture + PDF avec HTML envoyé par le front
router.post('/', authenticateToken, checkDocumentQuota, async (req, res) => {
  const userId = req.user.userId
  const {
    client,
    dueAt,
    iban,
    bic,
    items,
    invoiceHtml, // <-- utilisé pour le PDF
    ...rest
  } = req.body

  if (!invoiceHtml) {
    return res.status(400).json({ error: "Le champ invoiceHtml (HTML de la facture) est requis." })
  }

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

    // 2. Génération numéro unique
    const year = new Date().getFullYear()
    const regex = new RegExp(`^${year}-(\\d{3})$`)
    const invoicesThisYear = await prisma.invoice.findMany({
      where: { userId, number: { startsWith: `${year}-` } },
      select: { number: true }
    })

    let nextNumber = 1
    if (invoicesThisYear.length > 0) {
      const nums = invoicesThisYear
        .map((inv: any) => {
          const match = inv.number.match(regex)
          return match ? parseInt(match[1], 10) : 0
        })
        .filter((n: number) => !isNaN(n))
      if (nums.length > 0) {
        nextNumber = Math.max(...nums) + 1
      }
    }
    let number = `${year}-${String(nextNumber).padStart(3, '0')}`
    let exists = await prisma.invoice.findUnique({ where: { number } })
    let tries = 0
    const maxTries = 10
    while (exists && tries < maxTries) {
      nextNumber++
      number = `${year}-${String(nextNumber).padStart(3, '0')}`
      exists = await prisma.invoice.findUnique({ where: { number } })
      if (!exists) break
      tries++
    }
    if (tries === maxTries && exists) {
      return res.status(500).json({ error: "Impossible de générer un numéro de facture unique. Veuillez réessayer." })
    }

    // 3. Calcul totaux
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

    // 4. Création en base
    let newInvoice = await prisma.invoice.create({
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
        dueAt: dueAt ? new Date(dueAt) : undefined,
        iban,
        bic,
        totalHT,
        totalTVA,
        totalTTC,
        items: { createMany: { data: invoiceItems } },
        invoiceHtml // <--- Ajout ! (Pense à ajouter le champ dans Prisma)
      },
      include: { items: true, client: true },
    })

    // 5. Génération du PDF avec Puppeteer
    const pdfDir = path.join(__dirname, "../../invoices_pdf")
    await fs.mkdir(pdfDir, { recursive: true })
    const pdfFilename = `${newInvoice.number}.pdf`
    const pdfPath = path.join(pdfDir, pdfFilename)
    await generateInvoicePdfWithPuppeteer(invoiceHtml, pdfPath)

    newInvoice = await prisma.invoice.update({
      where: { id: newInvoice.id },
      data: { pdfPath: pdfFilename },
      include: { items: true, client: true },
    })

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
  const allowedStatuts = ["PAYEE", "EN_ATTENTE", "ANNULE"]
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

// GET /invoices/:id/pdf — Télécharge le PDF par numéro
router.get('/:id/pdf', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const invoiceNumber = req.params.id

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
