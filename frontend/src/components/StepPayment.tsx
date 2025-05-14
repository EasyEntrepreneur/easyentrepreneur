'use client';

import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import styles from './StepPayment.module.css';
import AddCardForm from './AddCardForm';
import { usePaymentMethods } from '../hooks/usePaymentMethods';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Props = {
  montant: number;
  plan: string;
  userId: string;
  onPaymentMethodSelected: (id: string) => void;
};

export default function StepPayment({ montant, plan, userId, onPaymentMethodSelected }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('new');
  const { methods: paymentMethods, loading, refetch } = usePaymentMethods(userId);

  // Crée un SetupIntent pour ajouter une carte
  useEffect(() => {
    const createSetupIntent = async () => {
      try {
        if (!userId) return;

        const userRes = await fetch(`http://localhost:5000/api/get-customer-id?userId=${userId}`);
        const userData = await userRes.json();
        const stripeCustomerId = userData?.stripeCustomerId;

        if (!stripeCustomerId) {
          console.error('Aucun stripeCustomerId trouvé pour cet utilisateur');
          return;
        }

        const res = await fetch('http://localhost:5000/api/stripe/setup-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: stripeCustomerId,
            userId,
          }),
        });

        const data = await res.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Erreur setupIntent :', err);
      }
    };

    createSetupIntent();
  }, [userId]);

  // Définit automatiquement la première carte enregistrée
  useEffect(() => {
    if (!loading) {
      if (paymentMethods.length > 0) {
        setSelectedMethod(paymentMethods[0].id);
        onPaymentMethodSelected(paymentMethods[0].id);
      } else {
        setSelectedMethod('new');
      }
    }
  }, [paymentMethods, loading, onPaymentMethodSelected]);

  // Met à jour la carte sélectionnée
  useEffect(() => {
    if (selectedMethod !== 'new') {
      onPaymentMethodSelected(selectedMethod);
    }
  }, [selectedMethod, onPaymentMethodSelected]);

  return (
    <div className={styles.stepBox}>
      {!loading && (
        <div className={styles.paymentOptions}>
          {paymentMethods.map((pm) => (
            <label key={pm.id} className={styles.radioOption}>
              <input
                type="radio"
                name="paymentMethod"
                value={pm.id}
                checked={selectedMethod === pm.id}
                onChange={() => setSelectedMethod(pm.id)}
              />
              <div className={styles.savedCard}>
                <span>
                  {pm.brand?.toUpperCase()} •••• {pm.last4} — {pm.exp_month}/{pm.exp_year}
                </span>
              </div>
            </label>
          ))}

          <label className={styles.radioOption}>
            <input
              type="radio"
              name="paymentMethod"
              value="new"
              checked={selectedMethod === 'new'}
              onChange={() => setSelectedMethod('new')}
            />
            <span>Ajouter une carte</span>
          </label>
        </div>
      )}

      {selectedMethod === 'new' && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <AddCardForm clientSecret={clientSecret} userId={userId} onCardSaved={refetch} />
        </Elements>
      )}
    </div>
  );
}
