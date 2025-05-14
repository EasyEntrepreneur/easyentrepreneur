'use client';

import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js';
import { useState } from 'react';
import styles from './AddCardForm.module.css';

type Props = {
  clientSecret: string;
  userId: string;
  onCardSaved?: (paymentMethodId: string) => void;
};

export default function AddCardForm({ clientSecret, userId, onCardSaved }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!stripe || !elements) return;

    if (!clientSecret) {
      setError("Impossible de vérifier la carte : clientSecret manquant.");
      return;
    }

    const card = elements.getElement(CardNumberElement);
    const exp = elements.getElement(CardExpiryElement);
    const cvc = elements.getElement(CardCvcElement);

    if (!card || !exp || !cvc) {
      setError("Veuillez remplir tous les champs de carte.");
      return;
    }

    setLoading(true);

    const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card,
        billing_details: { name },
      },
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Erreur lors de l’enregistrement de la carte.');
      setLoading(false);
      return;
    }

    if (setupIntent?.status === 'succeeded') {
      const paymentMethodId = setupIntent.payment_method as string;
      console.log('✅ Carte enregistrée :', paymentMethodId);

      try {
        const res = await fetch(`${API_URL}/save-payment-method`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, paymentMethodId }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError("Carte enregistrée chez Stripe, mais échec côté base de données.");
          setLoading(false);
          return;
        }

        setSuccess("✅ Carte ajoutée avec succès.");
        if (onCardSaved) onCardSaved(paymentMethodId);
      } catch (err) {
        console.error('Erreur backend :', err);
        setError("Erreur serveur lors de l’enregistrement de la carte.");
      }
    } else {
      setError("L'enregistrement de la carte a échoué.");
    }

    setLoading(false);
  };

  return (
    <form className={styles.cardForm} onSubmit={handleSubmit}>
      <label className={styles.formLabel}>Nom du titulaire</label>
      <input
        className={styles.textInput}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="ex : Jean Dupont"
      />

      <label className={styles.formLabel}>Numéro de carte</label>
      <div className={styles.stripeInput}>
        <CardNumberElement />
      </div>

      <div className={styles.row}>
        <div className={styles.column}>
          <label className={styles.formLabel}>Date d'expiration</label>
          <div className={styles.stripeInput}>
            <CardExpiryElement />
          </div>
        </div>

        <div className={styles.column}>
          <label className={styles.formLabel}>CVC</label>
          <div className={styles.stripeInput}>
            <CardCvcElement />
          </div>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}

      <button type="submit" className={styles.addButton} disabled={loading}>
        {loading ? 'Ajout en cours...' : 'Ajouter cette carte'}
      </button>
    </form>
  );
}
