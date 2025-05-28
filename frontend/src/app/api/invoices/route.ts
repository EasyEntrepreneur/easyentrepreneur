import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticateTokenApiRoute } from '@/lib/middlewares/authenticateTokenApiRoute'

function isUser(obj: any): obj is { userId: string } {
  return obj && typeof obj.userId === "string";
}

export async function GET(req: NextRequest) {
  const auth = await authenticateTokenApiRoute(req)
  if (!isUser(auth)) return auth;
  const userId = auth.userId;

  // Récupère aussi les infos société (émetteur) via la relation utilisateur
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    include: {
      items: true,
      client: true,
      user: { include: { companyInfo: true } },
    },
    orderBy: { issuedAt: 'desc' }
  })
  return NextResponse.json(invoices)
}

export async function POST(req: NextRequest) {
  const auth = await authenticateTokenApiRoute(req)
  if (!isUser(auth)) return auth;
  const userId = auth.userId;

  const body = await req.json()
  const {
    issuer, // = companyInfo
    client,
    dueAt,
    items,
    invoiceHtml,
    invoiceTitle,
    paymentInfo,
    legalNote,
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

  // === GESTION CLIENT (création si non existant) ===
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

  // === GESTION COMPANYINFO (EMETTEUR - MAJ ou CREATE si non existant) ===
  // On update la fiche CompanyInfo de l'utilisateur connecté (unique par userId)
  let dbCompanyInfo = await prisma.companyInfo.findUnique({ where: { userId } });
  if (!dbCompanyInfo) {
    dbCompanyInfo = await prisma.companyInfo.create({
      data: {
        userId,
        name: issuer.name,
        address: issuer.address,
        zip: issuer.zip,
        city: issuer.city,
        siret: issuer.siret || "",
        vat: issuer.vat || "",
        phone: issuer.phone || "",
      }
    })
  } else {
    dbCompanyInfo = await prisma.companyInfo.update({
      where: { userId },
      data: {
        name: issuer.name,
        address: issuer.address,
        zip: issuer.zip,
        city: issuer.city,
        siret: issuer.siret || "",
        vat: issuer.vat || "",
        phone: issuer.phone || "",
      }
    })
  }

  // Création de la facture
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
      totalHT,
      totalTVA,
      totalTTC,
      items: { createMany: { data: invoiceItems } },
      invoiceHtml,
      invoiceTitle,
      paymentInfo,
      legalNote,
    },
    include: {
      items: true,
      client: true,
      user: { include: { companyInfo: true } },
    },
  })

  return NextResponse.json({ ...newInvoice })
}
