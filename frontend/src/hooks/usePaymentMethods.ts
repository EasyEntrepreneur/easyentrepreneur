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
        console.error('❌ Réponse non JSON reçue (probablement une 404 ou 500)');
        setMethods([]);
        return;
      }

      const data = await res.json();
      console.log('✅ Données cartes reçues du backend :', data);

      if (!res.ok || !data.success) {
        console.error('❌ Erreur côté API:', data);
        setMethods([]);
        return;
      }

      if (Array.isArray(data.paymentMethods)) {
        const formatted = data.paymentMethods.map((pm: any) => ({
          id: pm.id,
          brand: pm.card?.brand ?? 'inconnue',
          last4: pm.card?.last4 ?? '0000',
          exp_month: pm.card?.exp_month ?? 0,
          exp_year: pm.card?.exp_year ?? 0,
        }));
        setMethods(formatted);
      } else {
        console.error('❌ Réponse attendue : tableau de méthodes. Reçu :', data);
        setMethods([]);
      }
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des cartes :', err);
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
