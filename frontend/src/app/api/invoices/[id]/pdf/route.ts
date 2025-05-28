import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, context: any) {
  const { id } = context.params

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      client: true,
      user: { include: { companyInfo: true } }
    }
  })

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })
  }

  return NextResponse.json(invoice)
}
