import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import prisma from '@/lib/prisma'

type QuoteItem = {
  description: string
  quantity: number
  unitPrice: number
  vatRate: number
  totalHT: number
  totalTVA: number
  totalTTC: number
}

export async function GET(
  req: NextRequest,
  context: any // ou simplement context (pas typé)
) {
  const { id } = context.params

  // Récupération du devis + lignes + client + user et companyInfo
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: {
      items: true,
      client: true,
      user: {
        include: {
          companyInfo: true
        }
      }
    }
  })

  if (!quote) {
    return NextResponse.json({ error: "Devis introuvable" }, { status: 404 })
  }

  // --- Création PDF ---
  const doc = new PDFDocument({ margin: 40 })
  const chunks: Buffer[] = []
  doc.on('data', chunk => chunks.push(chunk))
  doc.on('end', () => {})

  // === HEADER ===
  doc.fontSize(22).text(`Devis n°${quote.number}`, { align: 'center' })
  doc.moveDown(0.5)
  doc.fontSize(12)
  doc.text(`Émis le : ${new Date(quote.issuedAt).toLocaleDateString("fr-FR")}`)
  if (quote.validUntil) {
    doc.text(`Valable jusqu'au : ${new Date(quote.validUntil).toLocaleDateString("fr-FR")}`)
  }
  doc.text(`Statut : ${quote.statut}`)
  doc.moveDown(0.5)

  // === CLIENT & ÉMETTEUR ===
  doc.fontSize(11)
  doc.text('Émetteur :', { underline: true })
  doc.text(quote.user?.companyInfo?.name || 'Votre société')
  doc.text(quote.user?.companyInfo?.address || '')
  doc.text(
    [quote.user?.companyInfo?.zip, quote.user?.companyInfo?.city].filter(Boolean).join(' ')
  )
  if (quote.user?.companyInfo?.siret) doc.text(`SIRET : ${quote.user.companyInfo.siret}`)
  if (quote.user?.companyInfo?.vat) doc.text(`TVA : ${quote.user.companyInfo.vat}`)

  doc.moveDown(0.7)
  doc.text('Client :', { underline: true })
  doc.text(quote.clientName)
  doc.text(quote.clientAddress)
  doc.text([quote.clientZip, quote.clientCity].filter(Boolean).join(' '))
  if (quote.clientEmail) doc.text(`Email : ${quote.clientEmail}`)
  if (quote.clientPhone) doc.text(`Tél : ${quote.clientPhone}`)

  doc.moveDown(1)

  // === TABLEAU LIGNES ===
  doc.fontSize(11).font('Helvetica-Bold')
  doc.text('Désignation', 40, doc.y, { width: 180, continued: true })
  doc.text('Qté', 230, doc.y, { width: 30, align: 'right', continued: true })
  doc.text('PU HT', 265, doc.y, { width: 50, align: 'right', continued: true })
  doc.text('TVA', 320, doc.y, { width: 40, align: 'right', continued: true })
  doc.text('Total HT', 370, doc.y, { width: 60, align: 'right', continued: true })
  doc.text('Total TTC', 435, doc.y, { width: 70, align: 'right' })
  doc.moveDown(0.3)
  doc.font('Helvetica')

  // TVA Map pour total par taux
  const tvaMap: Record<string, number> = {}

  for (const item of quote.items as QuoteItem[]) {
    doc.text(item.description, 40, doc.y, { width: 180, continued: true })
    doc.text(item.quantity.toString(), 230, doc.y, { width: 30, align: 'right', continued: true })
    doc.text(item.unitPrice.toFixed(2), 265, doc.y, { width: 50, align: 'right', continued: true })
    doc.text((item.vatRate || 0).toFixed(2) + ' %', 320, doc.y, { width: 40, align: 'right', continued: true })
    doc.text(item.totalHT.toFixed(2), 370, doc.y, { width: 60, align: 'right', continued: true })
    doc.text(item.totalTTC.toFixed(2), 435, doc.y, { width: 70, align: 'right' })
    doc.moveDown(0.2)
    // Calcule le montant TVA par taux
    const taux = (item.vatRate || 0).toFixed(2)
    tvaMap[taux] = (tvaMap[taux] || 0) + item.totalTVA
  }

  doc.moveDown(1)

  // === TOTAUX ===
  doc.font('Helvetica-Bold')
  doc.text('Total HT', 340, doc.y, { continued: true })
  doc.text(quote.totalHT.toFixed(2) + ' €', 435, doc.y, { align: 'right' })
  doc.moveDown(0.3)

  // Affichage TVA(s) par taux
  doc.font('Helvetica')
  Object.entries(tvaMap).forEach(([taux, montant]) => {
    doc.text(`TVA ${taux} %`, 340, doc.y, { continued: true })
    doc.text(montant.toFixed(2) + ' €', 435, doc.y, { align: 'right' })
    doc.moveDown(0.2)
  })

  doc.font('Helvetica-Bold')
  doc.text('Total TVA', 340, doc.y, { continued: true })
  doc.text(quote.totalTVA.toFixed(2) + ' €', 435, doc.y, { align: 'right' })
  doc.moveDown(0.3)
  doc.text('Total TTC', 340, doc.y, { continued: true })
  doc.text(quote.totalTTC.toFixed(2) + ' €', 435, doc.y, { align: 'right' })

  // === NOTES / CONDITIONS ===
  if (quote.notes) {
    doc.moveDown(1)
    doc.fontSize(10).text('Conditions/Notes :', { underline: true })
    doc.fontSize(10).text(quote.notes)
  }

  doc.moveDown(1.5)
  doc.font('Helvetica').fontSize(10).text('TVA non applicable, art. 293B du CGI.', { align: 'center' })

  doc.end()
  await new Promise(resolve => doc.on('end', resolve))
  const pdfBuffer = Buffer.concat(chunks)

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Devis-${quote.number}.pdf"`,
    },
  })
}
