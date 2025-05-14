'use client';

import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.columnBrand}>
          <h3 className={styles.logo}>EasyEntrepreneur</h3>
          <p className={styles.description}>
            L’assistant intelligent des micro-entrepreneurs.
            Gagne du temps, automatise ta gestion.
          </p>
        </div>

        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Navigation</h4>
          <ul>
            <li><a href="#how" className={styles.link}>Comment ça marche</a></li>
            <li><a href="#pricing" className={styles.link}>Tarifs</a></li>
            <li><a href="#contact" className={styles.link}>Contact</a></li>
          </ul>
        </div>

        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Support</h4>
          <ul>
            <li><a href="#faq" className={styles.link}>FAQ</a></li>
            <li><a href="mailto:support@easyentrepreneur.fr" className={styles.link}>support@easyentrepreneur.fr</a></li>
          </ul>
        </div>

        <div className={styles.column}>
          <h4 className={styles.columnTitle}>Légal</h4>
          <ul>
            <li><a href="#mentions légales" className={styles.link}>Mentions légales</a></li>
            <li><a href="#Politique" className={styles.link}>Politiques de confidentialité</a></li>
            <li><a href="CGV" className={styles.link}>CGV</a></li>
            <li><a href="#sitemap" className={styles.link}>Sitemap</a></li>
          </ul>
        </div>

      </div>
      <div className={styles.bottomBar}>
        &copy; {new Date().getFullYear()} EasyEntrepreneur. Tous droits réservés.
      </div>
    </footer>
  );
};

export default Footer;
