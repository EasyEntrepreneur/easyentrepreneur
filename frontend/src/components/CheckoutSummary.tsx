'use client';

import { useState } from 'react';
import styles from './CheckoutSummary.module.css';

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
  const subtotal = prixAnnuel;
  const vat = subtotal * 0.2;
  const total = subtotal + vat;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setError(null);

    if (!selectedCardId) {
      setError('Veuillez sélectionner une carte de paiement.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/stripe/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          paymentMethodId: selectedCardId,
          amount: total,
          plan,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        window.location.href = '/merci';
      } else {
        setError(`❌ Paiement échoué : ${data?.error || 'erreur inconnue'}`);
      }
    } catch (err) {
      console.error('Erreur lors du paiement :', err);
      setError('❌ Erreur serveur pendant le paiement.');
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

      <button
        onClick={handlePay}
        disabled={!selectedCardId || loading}
        className={`${styles.payNowButton} ${(!selectedCardId || loading) ? styles.disabled : ''}`}
      >
        {loading ? 'Paiement en cours...' : 'Procéder au paiement'}
      </button>

      {error && <p className={styles.error}>{error}</p>}

      <p className={styles.legal}>
        Votre abonnement est renouvelé automatiquement sauf désactivation manuelle.
      </p>
      <p className={styles.legalSmall}>
        Paiement sécurisé. Garantie de remboursement 30 jours.
      </p>
    </div>
  );
}
