import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import prisma from '@/lib/prisma'

type InvoiceItem = {
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
  context: any
) {
  const { id } = context.params

  // Récupération de la facture + lignes + client éventuel + user et companyInfo
  const invoice = await prisma.invoice.findUnique({
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

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 })
  }

  // --- Création PDF ---
  const doc = new PDFDocument({ margin: 40 })
  const chunks: Buffer[] = []
  doc.on('data', chunk => chunks.push(chunk))
  doc.on('end', () => {})

  // === HEADER ===
  doc.fontSize(22).text(`Facture n°${invoice.number}`, { align: 'center' })
  doc.moveDown(0.5)
  doc.fontSize(12)
  doc.text(`Émise le : ${new Date(invoice.issuedAt).toLocaleDateString("fr-FR")}`)
  doc.text(`Statut : ${invoice.statut}`)
  doc.moveDown(0.5)

  // === CLIENT & ÉMETTEUR ===
  doc.fontSize(11)
  doc.text('Émetteur :', { underline: true })
  doc.text(invoice.user?.companyInfo?.name || 'Votre société')
  doc.text(invoice.user?.companyInfo?.address || '')
  doc.text(
    [invoice.user?.companyInfo?.zip, invoice.user?.companyInfo?.city].filter(Boolean).join(' ')
  )
  if (invoice.user?.companyInfo?.siret) doc.text(`SIRET : ${invoice.user.companyInfo.siret}`)
  if (invoice.user?.companyInfo?.vat) doc.text(`TVA : ${invoice.user.companyInfo.vat}`)

  doc.moveDown(0.7)
  doc.text('Client :', { underline: true })
  doc.text(invoice.clientName)
  doc.text(invoice.clientAddress)
  doc.text([invoice.clientZip, invoice.clientCity].filter(Boolean).join(' '))
  if (invoice.clientEmail) doc.text(`Email : ${invoice.clientEmail}`)
  if (invoice.clientPhone) doc.text(`Tél : ${invoice.clientPhone}`)

  doc.moveDown(1)

  // === TABLEAU LIGNES ===
  doc.fontSize(11)
  doc.text('Désignation', 40, doc.y, { width: 180, continued: true })
  doc.text('Qté', 230, doc.y, { width: 30, align: 'right', continued: true })
  doc.text('PU HT', 265, doc.y, { width: 50, align: 'right', continued: true })
  doc.text('TVA', 320, doc.y, { width: 40, align: 'right', continued: true })
  doc.text('Total HT', 370, doc.y, { width: 60, align: 'right', continued: true })
  doc.text('Total TTC', 435, doc.y, { width: 70, align: 'right' })
  doc.moveDown(0.3)

  // TVA Map pour total par taux
  const tvaMap: Record<string, number> = {}

  for (const item of invoice.items as InvoiceItem[]) {
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
  doc.text('Total HT', 340, doc.y, { continued: true })
  doc.text(invoice.totalHT.toFixed(2) + ' €', 435, doc.y, { align: 'right' })
  doc.moveDown(0.3)

  // Affichage TVA(s) par taux
  Object.entries(tvaMap).forEach(([taux, montant]) => {
    doc.text(`TVA ${taux} %`, 340, doc.y, { continued: true })
    doc.text(montant.toFixed(2) + ' €', 435, doc.y, { align: 'right' })
    doc.moveDown(0.2)
  })

  doc.text('Total TVA', 340, doc.y, { continued: true })
  doc.text(invoice.totalTVA.toFixed(2) + ' €', 435, doc.y, { align: 'right' })
  doc.moveDown(0.3)
  doc.text('Total TTC', 340, doc.y, { continued: true })
  doc.text(invoice.totalTTC.toFixed(2) + ' €', 435, doc.y, { align: 'right' })

  doc.moveDown(1.5)
  doc.fontSize(10).text('TVA non applicable, art. 293B du CGI.', { align: 'center' })

  // === INFOS DE PAIEMENT (optionnel) ===
  if (invoice.paymentInfo || invoice.iban) {
    doc.moveDown(1)
    doc.fontSize(11).text('Informations de paiement :', { underline: true })
    if (invoice.paymentInfo) doc.text(invoice.paymentInfo)
    if (invoice.iban) doc.text(`IBAN : ${invoice.iban}`)
    if (invoice.bic) doc.text(`BIC : ${invoice.bic}`)
  }

  doc.end()
  await new Promise(resolve => doc.on('end', resolve))
  const pdfBuffer = Buffer.concat(chunks)

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Facture-${invoice.number}.pdf"`,
    },
  })
}
