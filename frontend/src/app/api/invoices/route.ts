import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateTokenApiRoute } from '@/lib/middlewares/authenticateTokenApiRoute' // Middleware adapté pour Next API (voir note plus bas)

export async function GET(req: NextRequest) {
  // Authentification
  const { userId } = await authenticateTokenApiRoute(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Liste des factures de l'utilisateur
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    include: { items: true, client: true },
    orderBy: { issuedAt: 'desc' }
  })
  return NextResponse.json(invoices)
}

export async function POST(req: NextRequest) {
  const { userId } = await authenticateTokenApiRoute(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const {
    client,
    dueAt,
    iban,
    bic,
    items,
    invoiceHtml, // <-- utilisé pour la génération PDF côté client
    ...rest
  } = body

  if (!invoiceHtml) {
    return NextResponse.json({ error: "Le champ invoiceHtml (HTML de la facture) est requis." }, { status: 400 })
  }

  // Génération du numéro unique
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
    return NextResponse.json({ error: "Impossible de générer un numéro de facture unique. Veuillez réessayer." }, { status: 500 })
  }

  // Calcul totaux
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

  // Gestion du client (création si non existant)
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

  // Création de la facture (stocke l'HTML, pas de PDF)
  const newInvoice = await prisma.invoice.create({
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
      invoiceHtml, // Stocké pour permettre la génération PDF côté client
    },
    include: { items: true, client: true },
  })

  return NextResponse.json({ ...newInvoice })
}
