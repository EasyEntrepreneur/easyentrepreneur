'use client';

import { PDFViewer } from '@react-pdf/renderer';
import QuotePDF from '@/components/QuotePDF';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function DevisPDFPage() {
  const { id } = useParams() as { id: string };
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      const res = await fetch(`/api/quotes/${id}`);
      if (res.ok) {
        setQuote(await res.json());
      }
      setLoading(false);
    };
    fetchQuote();
  }, [id]);

  if (loading) return <div>Chargement…</div>;
  if (!quote) return <div>Devis introuvable</div>;

  // Préparation des props pour le composant QuotePDF
  const companyInfo = quote?.user?.companyInfo || {};

  return (
    <PDFViewer width="100%" height="1000px" style={{ minHeight: 800 }}>
      <QuotePDF
        number={quote.number}
        issuedAt={quote.issuedAt}
        validUntil={quote.validUntil}
        statut={quote.statut}
        client={{
          name: quote.clientName,
          address: quote.clientAddress,
          zip: quote.clientZip,
          city: quote.clientCity,
          email: quote.clientEmail,
          phone: quote.clientPhone,
          vat: quote.clientVat, // adapte ce champ si besoin
        }}
        items={quote.items}
        totalHT={quote.totalHT}
        totalTVA={quote.totalTVA}
        totalTTC={quote.totalTTC}
        notes={quote.notes}
        user={quote.user}
      />
    </PDFViewer>
  );
}
