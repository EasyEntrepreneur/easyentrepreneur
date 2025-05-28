// frontend/src/app/dashboard/factures/[id]/pdf/page.tsx

'use client'

import { PDFViewer } from '@react-pdf/renderer'
import InvoicePDF from '@/components/InvoicePDF'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function FacturePDFPage() {
  const { id } = useParams() as { id: string }
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoice = async () => {
      const res = await fetch(`/api/invoices/${id}`)
      if (res.ok) setInvoice(await res.json())
      setLoading(false)
    }
    fetchInvoice()
  }, [id])

  if (loading) return <div>Chargement...</div>
  if (!invoice) return <div>Facture introuvable</div>

  // Déstructure ici pour passer les bonnes props à InvoicePDF
  return (
    <PDFViewer width="100%" height="1000px" style={{ minHeight: 800 }}>
      <InvoicePDF
        invoiceNumber={invoice.number}
        issuedAt={invoice.issuedAt}
        statut={invoice.statut}
        issuer={invoice.user?.companyInfo || {}}
        client={{
          name: invoice.clientName,
          address: invoice.clientAddress,
          zip: invoice.clientZip,
          city: invoice.clientCity,
          phone: invoice.clientPhone,
          email: invoice.clientEmail,
          vat: invoice.clientVAT, // ou invoice.clientVat selon le champ exact !
        }}
        items={invoice.items}
        totalHT={invoice.totalHT}
        totalTVA={invoice.totalTVA}
        totalTTC={invoice.totalTTC}
        paymentInfo={invoice.paymentInfo}
        iban={invoice.iban}
        bic={invoice.bic}
      />
    </PDFViewer>
  )
}
