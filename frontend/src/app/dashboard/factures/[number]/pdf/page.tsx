'use client';

import { useEffect, useRef, useState } from 'react';

export default function FacturePdfPage({ params }: { params: { number: string } }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPdf = async () => {
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/invoices/${params.number}.pdf`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error('Impossible de charger le PDF');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (iframeRef.current) {
          iframeRef.current.src = url;
        }
      } catch (err: any) {
        setError(err?.message || 'Erreur');
      }
    };
    fetchPdf();
  }, [params.number]);

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#222' }}>
      {error ? (
        <div style={{ color: 'red', padding: 40 }}>{error}</div>
      ) : (
        <iframe
          ref={iframeRef}
          style={{ width: '100vw', height: '100vh', border: 'none' }}
          title="Facture PDF"
        />
      )}
    </div>
  );
}
