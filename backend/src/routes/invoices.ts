import { Router } from 'express'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middlewares/authenticateToken'

const router = Router()

// GET /invoices — toutes les factures du user connecté
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id

  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: { items: true },
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
  const userId = req.user.id
  const invoiceId = req.params.id

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { items: true },
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

// POST /invoices — création d’une facture
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id
  const {
    clientName,
    clientAddress,
    clientZip,
    clientCity,
    clientCountry,
    clientEmail,
    clientPhone,
    dueAt,
    iban,
    bic,
    items,
  } = req.body

  try {
    // Générer un numéro de facture (ex : 2024-001)
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
    const newInvoice = await prisma.invoice.create({
      data: {
        number,
        userId,
        clientName,
        clientAddress,
        clientZip,
        clientCity,
        clientCountry,
        clientEmail,
        clientPhone,
        dueAt: dueAt ? new Date(dueAt) : undefined,
        iban,
        bic,
        totalHT,
        totalTVA,
        totalTTC,
        items: {
          createMany: {
            data: invoiceItems,
          },
        },
      },
      include: { items: true },
    })

    res.status(201).json(newInvoice)
  } catch (error) {
    console.error('Erreur POST /invoices :', error)
    res.status(500).json({ error: 'Erreur serveur lors de la création de la facture.' })
  }
})

export default router
