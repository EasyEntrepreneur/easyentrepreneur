import { useCallback, useEffect, useState } from 'react';

export type PaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
};

export function usePaymentMethods(userId: string | null) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMethods = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get-payment-methods?userId=${userId}`);
      const contentType = res.headers.get('content-type');

      if (!contentType || !contentType.includes('application/json')) {
        console.error('Réponse non JSON reçue (probablement une 404 ou 500)');
        setMethods([]);
        return;
      }

      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error('Réponse attendue : tableau de méthodes. Reçu :', data);
        setMethods([]);
        return;
      }

      setMethods(data);
    } catch (err) {
      console.error('Erreur lors de la récupération des cartes :', err);
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  return { methods, loading, refetch: fetchMethods };
}
