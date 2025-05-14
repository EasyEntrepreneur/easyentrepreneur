// src/components/StripeCardForm.tsx
'use client';

import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';

export default function StripeCardForm({
  clientSecret,
  montant,
}: {
  clientSecret: string;
  montant: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePayment = async () => {
    if (!stripe || !elements) return;

    setLoading(true);
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    });

    if (result.error) {
      setMessage(result.error.message || 'Erreur');
    } else if (result.paymentIntent?.status === 'succeeded') {
      setMessage('✅ Paiement réussi !');
    }

    setLoading(false);
  };

  return (
    <div>
      <CardElement options={{ hidePostalCode: true }} />
      <button onClick={handlePayment} disabled={!stripe || loading}>
        {loading ? 'Paiement en cours...' : `Payer ${montant.toFixed(2)} €`}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
