'use client';

import styles from './FeatureSection.module.css';
import { FaClock, FaBolt, FaSmile, FaTasks, FaRobot, FaCheckCircle } from 'react-icons/fa';

const features = [
  {
    icon: <FaTasks />,
    title: "Générer des documents",
    description: "Crée en un clic des factures, attestations et autres documents officiels conformes."
  },
  {
    icon: <FaClock />,
    title: "Suivre tes revenus",
    description: "Visualise ton chiffre d’affaires, tes seuils et ton historique en temps réel."
  },
  {
    icon: <FaBolt />,
    title: "Recevoir une aide intelligente",
    description: "Laisse notre assistant IA t’aiguiller sur tes obligations et échéances importantes."
  },
  {
    icon: <FaRobot />,
    title: "Automatiser ta gestion",
    description: "Réduis le temps passé sur l’administratif grâce à des automatisations simples."
  },
  {
    icon: <FaSmile />,
    title: "Gagner du temps",
    description: "Accélère ta gestion quotidienne avec une interface rapide et intuitive."
  },
  {
    icon: <FaCheckCircle />,
    title: "Ne rien oublier",
    description: "Reçois des rappels pour toutes tes échéances légales et fiscales."
  }
];

const FeatureSection = () => {
  return (
    <section className={styles.wrapper} id="features">
      <h2 className={styles.title}>
        Ce que tu peux faire avec <span>EasyEntrepreneur</span>
      </h2>

      <div className={styles.grid}>
        {features.map((feature, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.iconContainer}>{feature.icon}</div>
            <h3 className={styles.cardTitle}>{feature.title}</h3>
            <p className={styles.cardText}>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeatureSection;
