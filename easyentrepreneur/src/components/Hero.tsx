'use client';

import styles from './Hero.module.css';
import { FaFileAlt, FaCalendarCheck, FaUserCircle } from 'react-icons/fa';

const Hero = () => {
  return (
    <section className={styles.hero} id="hero">
      <h1 className={styles.title}>
        L’assistant IA des micro-entrepreneurs
      </h1>
      <p className={styles.subtitle}>
        Automatise ta paperasse, gagne du temps, concentre-toi sur ton activité.
      </p>
      <a href="#" className={styles.ctaButton}>
        Créer ma première facture
      </a>

      <div className={styles.cardsWrapper}>
        <div className={`${styles.card} ${styles.card1}`}>
          <FaFileAlt className={styles.cardIcon} />
          <div className={styles.cardTitle}>Génération automatique de documents</div>
        </div>
        <div className={`${styles.card} ${styles.card2}`}>
          <FaCalendarCheck className={styles.cardIcon} />
          <div className={styles.cardTitle}>Suivi des revenus</div>
        </div>
        <div className={`${styles.card} ${styles.card3}`}>
          <FaUserCircle className={styles.cardIcon} />
          <div className={styles.cardTitle}>Support administratif</div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
