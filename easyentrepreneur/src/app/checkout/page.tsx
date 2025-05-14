'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import styles from './CheckoutPage.module.css';

import StepBilling from '@/components/StepBilling';
import StepPayment from '@/components/StepPayment';
import CheckoutSummary from '@/components/CheckoutSummary';

const offres = [
  {
    id: 'basic',
    nom: 'Basique',
    prixMensuel: 4.99,
    prixAnnuel: 49.99,
    prixAffiche: '4.99 € / mois',
    economie: 'Économisez 9,98 €',
    description: 'Pour bien démarrer',
    avantages: [
      '5 documents / mois',
      'Support par email',
      'Accès au tableau de bord'
    ]
  },
  {
    id: 'standard',
    nom: 'Standard',
    prixMensuel: 9.99,
    prixAnnuel: 99.99,
    prixAffiche: '9.99 € / mois',
    economie: 'Économisez 19,98 €',
    description: 'La solution complète',
    populaire: true,
    avantages: [
      'Documents illimités',
      'Support prioritaire',
      'Historique complet'
    ]
  },
  {
    id: 'premium',
    nom: 'Premium',
    prixMensuel: 19.99,
    prixAnnuel: 199.90,
    prixAffiche: '19.99 € / mois',
    economie: 'Économisez 39,98 €',
    description: 'Pour aller plus loin',
    avantages: [
      'Assistant IA dédié',
      'API + Accès développeur',
      'Support 7j/7'
    ]
  }
];

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') || 'basic';
  const selectedPlan = offres.find((o) => o.id === planId);

  const [billingValidated, setBillingValidated] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  if (status === 'loading') {
    return <div className={styles.loading}>Chargement…</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <main className={styles.main}>
        <h1 className={styles.title}>Finalisez votre achat</h1>
        <p className={styles.subtitle}>
          Presque terminé ! Vérifiez vos informations et procédez au paiement sécurisé.
        </p>

        <div className={styles.content}>
          <div className={styles.left}>
            {/* Étape 1 : Connexion */}
            <div className={styles.stepBox}>
              <h3>1. Connecté en tant que :</h3>
              {session?.user?.email ? (
                <p className={styles.authInfo}>{session.user.email}</p>
              ) : (
                <div className={styles.authForms}></div>
              )}
            </div>

            {/* Étape 2 : Offre sélectionnée */}
            {selectedPlan && (
              <div className={styles.stepBox}>
                <h3>2. Offre sélectionnée</h3>
                <div className={styles.planCard}>
                  <strong>{selectedPlan.nom}</strong>
                </div>
              </div>
            )}

            {/* Étape 3 : Facturation */}
            <div className={styles.stepBox}>
              <h3>3. Informations de facturation</h3>
              <StepBilling
                userId={session!.user.id} // ✅ Ajout ici
                onSuccess={() => setBillingValidated(true)}
                onEdit={() => setBillingValidated(false)}
              />
            </div>

            {/* Étape 4 : Paiement */}
            <div className={styles.stepBox}>
              <h3>4. Méthode de paiement</h3>
              {billingValidated && selectedPlan && session?.user?.id && (
                <StepPayment
                  montant={selectedPlan.prixAnnuel}
                  plan={selectedPlan.id}
                  userId={session.user.id}
                  onPaymentMethodSelected={setSelectedCardId}
                />
              )}
            </div>
          </div>

          {/* Résumé Sticky à droite */}
          {selectedPlan && session?.user?.id && (
            <aside className={styles.sidebar}>
              <CheckoutSummary
                nom={selectedPlan.nom}
                prixMensuel={selectedPlan.prixMensuel}
                prixAnnuel={selectedPlan.prixAnnuel}
                economie={selectedPlan.economie}
                avantages={selectedPlan.avantages}
                userId={session.user.id}
                selectedCardId={selectedCardId}
                plan={selectedPlan.id as 'basic' | 'standard' | 'premium'}
              />
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
