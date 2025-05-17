import { Router } from 'express'
import prisma from '../lib/prisma'
import { authenticateToken } from '../middlewares/authenticateToken'

const router = Router()

// GET /invoices — toutes les factures du user connecté
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  console.log('userId reçu:', userId)

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

// POST /invoices — création d’une facture et création/lien du client
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId
  const {
    client, // On attend un objet client complet
    dueAt,
    iban,
    bic,
    items,
    ...rest // Les autres champs de facture (legalNote, etc)
  } = req.body

  try {
    // 1. Récupère ou crée le client
    let dbClient = null

    // Recherche : par SIRET si présent, sinon par nom+adresse+cp+ville
    if (client.siret) {
      dbClient = await prisma.client.findFirst({
        where: { userId, siret: client.siret }
      })
    }
    if (!dbClient) {
      dbClient = await prisma.client.findFirst({
        where: {
          userId: userId, // userId DOIT être défini ici
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
        userId: userId // userId 100% garanti ici !
      };
      console.log('>> clientToInsert', clientToInsert);
      dbClient = await prisma.client.create({
        data: clientToInsert
      });
    }

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
        clientId: dbClient.id, // On lie à la table client !
        clientName: client.name,            // (historique figé pour la facture)
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
        ...rest, // ex: legalNote, paymentInfo, etc
        items: {
          createMany: {
            data: invoiceItems,
          },
        },
      },
      include: { items: true, client: true },
    })

    res.status(201).json(newInvoice)
  } catch (error) {
    console.error('Erreur POST /invoices :', error)
    res.status(500).json({ error: 'Erreur serveur lors de la création de la facture.' })
  }
})

export default router
