'use client';

import { useSearchParams } from 'next/navigation';
import styles from './StepPlanSummary.module.css';

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

export default function StepPlanSummary() {
  const searchParams = useSearchParams();
  const selected = searchParams.get('plan') || 'standard';
  const plan = offres.find((o) => o.id === selected);

  if (!plan) return null;

  return (
    <div className={styles.stepBox}>
      <div className={styles.stepHeader}>
        <span className={styles.stepNumber}>2</span>
        <h3 className={styles.stepTitle}>Résumé de l'offre sélectionnée</h3>
      </div>
      <div className={styles.planCard}>
        <h4>{plan.nom}</h4>
        <p>
          <strong>{plan.prixMensuel.toFixed(2)} € / mois</strong> ou {plan.prixAnnuel.toFixed(2)} € / an
        </p>
        <p className={styles.saveText}>
          {plan.economie} (2 mois offerts)
        </p>
        <ul>
          {plan.avantages.map((feature, idx) => (
            <li key={idx}>✓ {feature}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
