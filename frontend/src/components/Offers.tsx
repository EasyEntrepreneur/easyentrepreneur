'use client';

import styles from './Offers.module.css';
import { useRouter } from 'next/navigation';

const offres = [
  {
    id: 'basic',
    nom: 'Basique',
    prixMensuel: 4.99,
    prixAnnuel: 49.99,
    prixAffiche: '4.99 € / mois',
    economie: 'Économisez 9,98 €',
    description: 'Pour bien démarrer',
    priceId: 'price_1ROhlzGxzBu5ejULKZIByW1f',
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
    priceId: 'price_1ROhjyGxzBu5ejULSWzAUYlF',
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
    priceId: 'price_1ROhmSGxzBu5ejULeOnma7aZ',
    avantages: [
      'Assistant IA dédié',
      'API + Accès développeur',
      'Support 7j/7'
    ]
  }
];

export default function OffersSection() {
  const router = useRouter();

  const handleChoosePlan = (plan: string, priceId: string) => {
    router.push(`/checkout?plan=${plan}&priceId=${priceId}`);
  };

  return (
    <section className={styles.pricingSection}>
      <h2 className={styles.title}>Nos Offres</h2>
      <p className={styles.subtitle}>
        Choisissez la formule qui correspond le mieux à votre activité.
      </p>

      <div className={styles.grid}>
        {offres.map((offre) => (
          <div
            key={offre.id}
            className={`${styles.card} ${offre.populaire ? styles.populaire : ''}`}
          >
            {offre.populaire && <div className={styles.badge}>Populaire</div>}
            {offre.economie && (
              <div className={styles.economieBadge}>{offre.economie}</div>
            )}
            <h3 className={styles.nom}>{offre.nom}</h3>
            <p className={styles.prix}>{offre.prixAffiche}</p>
            <p className={styles.annuel}>ou {offre.prixAnnuel.toFixed(2)} € / an</p>
            <p className={styles.description}>{offre.description}</p>
            <ul className={styles.liste}>
              {offre.avantages.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
            <button
              className={styles.selectButton}
              onClick={() => handleChoosePlan(offre.id, offre.priceId)}
            >
              Choisir cette offre
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
