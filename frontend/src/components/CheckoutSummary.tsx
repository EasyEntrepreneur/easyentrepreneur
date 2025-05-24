'use client';

import { useSearchParams } from 'next/navigation';
import { useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';
import styles from './CheckoutSummary.module.css';
import toast from 'react-hot-toast';

type Props = {
  nom: string;
  prixMensuel: number;
  prixAnnuel: number;
  economie: string;
  avantages: string[];
  userId: string;
  selectedCardId: string | null;
  plan: 'basic' | 'standard' | 'premium';
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CheckoutSummary({
  nom,
  prixMensuel,
  prixAnnuel,
  economie,
  avantages,
  userId,
  selectedCardId,
  plan,
}: Props) {
  const searchParams = useSearchParams();
  const priceId = searchParams.get('priceId') ?? '';
  const stripe = useStripe();

  const subtotal = prixAnnuel;
  const vat = subtotal * 0.2;
  const total = subtotal + vat;

  const [error] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    toast.error(null);

    if (!selectedCardId) {
      toast.error('Veuillez sélectionner une carte de paiement.');
      return;
    }

    setLoading(true);
    console.log("🔍 Données envoyées au backend :", {
      customerId: userId,
      paymentMethodId: selectedCardId,
      priceId,
    });

    try {
      const res = await fetch(`${API_URL}/create-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: userId,
          paymentMethodId: selectedCardId,
          priceId,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        toast.error(data.error || 'Une erreur est survenue lors de la souscription.');
        setLoading(false);
        return;
      }

      const result = await stripe?.confirmCardPayment(data.clientSecret, {
        payment_method: selectedCardId,
      });

      if (result?.error) {
        console.warn('❌ Erreur Stripe :', result.error);
        const code = result.error.code;

        if (code === 'card_declined') {
          toast.error('❌ Paiement refusé par votre banque. Essayez une autre carte.');
        } else if (code === 'insufficient_funds') {
          toast.error('❌ Fonds insuffisants. Vérifiez votre solde ou utilisez une autre carte.');
        } else if (code === 'expired_card') {
          toast.error('❌ Carte expirée. Veuillez en utiliser une autre.');
        } else if (code === 'payment_intent_incompatible_payment_method') {
          toast.error("❌ Le paiement a échoué. La carte n'a pas été transmise correctement.");
        } else {
          toast.error(result.error.message || '❌ Le paiement a échoué.');
        }
      } else {
        window.location.href = '/merci';
      }
    } catch (err) {
      toast.error('❌ Erreur serveur pendant le paiement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.summaryBox}>
      <h3 className={styles.title}>Résumé</h3>

      <div className={styles.planInfo}>
        <strong>{nom}</strong>
        <p>{prixMensuel.toFixed(2)} € / mois ou {prixAnnuel.toFixed(2)} € / an</p>
        <p className={styles.discount}>{economie} (2 mois offerts)</p>
        <ul>
          {avantages.map((f, i) => (
            <li key={i}>✓ {f}</li>
          ))}
        </ul>
      </div>

      <div className={styles.priceBreakdown}>
        <div className={styles.line}>
          <span>Sous-total</span>
          <span>{subtotal.toFixed(2)} €</span>
        </div>
        <div className={styles.line}>
          <span>TVA (20%)</span>
          <span>{vat.toFixed(2)} €</span>
        </div>
        <div className={styles.lineTotal}>
          <span>Total</span>
          <span>{total.toFixed(2)} €</span>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button
        onClick={handlePay}
        disabled={!selectedCardId || loading}
        className={`${styles.payNowButton} ${(!selectedCardId || loading) ? styles.disabled : ''}`}
      >
        {loading ? 'Paiement en cours...' : 'Procéder au paiement'}
      </button>

      <p className={styles.legal}>
        Votre abonnement est renouvelé automatiquement sauf désactivation manuelle.
      </p>
      <p className={styles.legalSmall}>
        Paiement sécurisé. Garantie de remboursement 30 jours.
      </p>
    </div>
  );
}
