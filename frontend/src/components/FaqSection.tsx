'use client';

import { useState } from 'react';
import styles from './FaqSection.module.css';
import clsx from 'clsx';

const faqs = [
  {
    question: 'EasyEntrepreneur est-il adapté aux débutants ?',
    answer: 'Oui, totalement. La plateforme est conçue pour être simple, intuitive et accessible, même sans aucune connaissance en comptabilité ou en gestion administrative.'
  },
  {
    question: 'Puis-je générer des factures conformes à la législation française ?',
    answer: 'Absolument. Nos factures respectent les normes légales en vigueur (mentions obligatoires, numérotation, TVA, etc.) et sont prêtes à être envoyées à vos clients.'
  },
  {
    question: 'Comment l’IA m’aide-t-elle dans ma gestion ?',
    answer: 'Elle te guide intelligemment. Notre assistant IA te rappelle tes obligations (déclarations, paiements), t’avertit des échéances à venir et te conseille selon ton activité.'
  },
  {
    question: 'Puis-je suivre mes revenus en temps réel ?',
    answer: 'Oui. EasyEntrepreneur t’offre un tableau de bord clair pour suivre ton chiffre d’affaires, comparer tes périodes et visualiser tes seuils.'
  },
  {
    question: 'Combien coûte EasyEntrepreneur ?',
    answer: 'Une version gratuite est disponible. Tu peux utiliser les fonctionnalités de base sans frais. Des options avancées sont disponibles avec un abonnement à petit prix.'
  }
];

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>Foires Aux Questions</h2>
      <div className={styles.list}>
        {faqs.map((faq, index) => (
          <div key={index} className={styles.item} onClick={() => toggle(index)}>
            <div className={styles.question}>
              <span>{faq.question}</span>
              <span className={styles.chevron}>{openIndex === index ? '▲' : '▼'}</span>
            </div>
            <div
              className={clsx(styles.answerWrapper, {
                [styles.open]: openIndex === index
              })}
            >
              <div className={styles.answer}>{faq.answer}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FaqSection;
