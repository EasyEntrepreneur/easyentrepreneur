'use client';

import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useSearchParams } from 'next/navigation';
import styles from './StepPayment.module.css';
import AddCardForm from './AddCardForm';
import { usePaymentMethods } from '../hooks/usePaymentMethods';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Props = {
  montant: number;
  plan: string;
  userId: string;
  onSubscriptionSuccess: () => void;
  onPaymentMethodSelected: (paymentMethodId: string) => void;
  onCustomerIdRetrieved: (customerId: string) => void;
};

export default function StepPayment({
  montant,
  plan,
  userId,
  onSubscriptionSuccess,
  onPaymentMethodSelected,
  onCustomerIdRetrieved,
}: Props) {
  const searchParams = useSearchParams();
  const priceId = searchParams.get('priceId') ?? '';
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('new');
  const { methods: paymentMethods, loading, refetch } = usePaymentMethods(userId);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);

  // Récupération du client Stripe
  useEffect(() => {
    const fetchCustomer = async () => {
      const userRes = await fetch(`${API_URL}/get-customer-id?userId=${userId}`);
      const userData = await userRes.json();
      const customerId = userData?.stripeCustomerId;
      setStripeCustomerId(customerId);
      onCustomerIdRetrieved(customerId);
    };

    fetchCustomer();
  }, [userId]);

  // Création du SetupIntent pour ajouter une carte
  useEffect(() => {
    const createSetupIntent = async () => {
      if (!stripeCustomerId) return;

      try {
        const res = await fetch(`${API_URL}/stripe/setup-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: stripeCustomerId, userId }),
        });

        const data = await res.json();
        setClientSecret(data.clientSecret);
        console.log('✅ SetupIntent clientSecret :', data.clientSecret);
      } catch (err) {
        console.error('Erreur lors de la création du SetupIntent', err);
      }
    };

    createSetupIntent();
  }, [stripeCustomerId, userId]);

  useEffect(() => {
    if (selectedMethod !== 'new') {
      onPaymentMethodSelected(selectedMethod);
    }
  }, [selectedMethod, onPaymentMethodSelected]);

  const handleCardSaved = async (newPaymentMethodId: string) => {
    await refetch();
    setSelectedMethod(newPaymentMethodId);
    onPaymentMethodSelected(newPaymentMethodId);
  };

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
                  {pm.brand} •••• {pm.last4} — {pm.exp_month}/{pm.exp_year}
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
          <AddCardForm
            clientSecret={clientSecret}
            userId={userId}
            onCardSaved={handleCardSaved}
          />
        </Elements>
      )}
    </div>
  );
}
