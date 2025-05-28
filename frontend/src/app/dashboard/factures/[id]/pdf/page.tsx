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
      if (res.ok) {
        const data = await res.json()
        setInvoice(data)
      }
      setLoading(false)
    }
    fetchInvoice()
  }, [id])

  if (loading) return <div>Chargement...</div>
  if (!invoice) return <div>Facture introuvable</div>

  // Adapte la structure passée à InvoicePDF ici !
  return (
    <PDFViewer width="100%" height="1000px" style={{ minHeight: 800 }}>
      <InvoicePDF
        invoiceNumber={invoice.number}
        issuedAt={invoice.issuedAt}
        statut={invoice.statut}
        issuer={{
          name: invoice.user?.companyInfo?.name,
          address: invoice.user?.companyInfo?.address,
          zip: invoice.user?.companyInfo?.zip,
          city: invoice.user?.companyInfo?.city,
          siret: invoice.user?.companyInfo?.siret,
          vat: invoice.user?.companyInfo?.vat,
        }}
        client={{
          name: invoice.clientName,
          address: invoice.clientAddress,
          zip: invoice.clientZip,
          city: invoice.clientCity,
          siret: invoice.clientSiret,
          vat: invoice.clientVat,
          email: invoice.clientEmail,
          phone: invoice.clientPhone,
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
