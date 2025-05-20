'use client';

import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useSearchParams } from 'next/navigation';
import styles from './StepPayment.module.css';
import AddCardForm from './AddCardForm';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import toast from 'react-hot-toast';

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
      try {
        const userRes = await fetch(`${API_URL}/get-customer-id?userId=${userId}`);
        if (!userRes.ok) {
          const err = await userRes.json();
          toast.error(err.message || "Erreur lors de la récupération du client Stripe.");
          return;
        }
        const userData = await userRes.json();
        const customerId = userData?.stripeCustomerId;
        if (!customerId) {
          toast.error("Aucun identifiant client Stripe trouvé.");
          return;
        }
        setStripeCustomerId(customerId);
        onCustomerIdRetrieved(customerId);
      } catch (error) {
        toast.error("Erreur réseau lors de la récupération du client Stripe.");
        console.error(error);
      }
    };

    fetchCustomer();
  }, [userId, onCustomerIdRetrieved]);

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

        if (!res.ok) {
          const err = await res.json();
          toast.error(err.message || "Erreur lors de la création du SetupIntent Stripe.");
          return;
        }

        const data = await res.json();
        if (!data.clientSecret) {
          toast.error("Impossible de récupérer le clientSecret pour Stripe.");
          return;
        }
        setClientSecret(data.clientSecret);
        console.log('✅ SetupIntent clientSecret :', data.clientSecret);
      } catch (err) {
        toast.error('Erreur réseau lors de la création du SetupIntent');
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
    toast.success('Carte enregistrée avec succès !');
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
