'use client';

import Link from 'next/link';
import styles from './HeaderAuth.module.css';

const HeaderAuth = () => {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href="/" className={styles.backButton}>
          ← Retour à l’accueil
        </Link>
      </div>
      <div className={styles.right}>
        <span className={styles.logo}>EasyEntrepreneur</span>
      </div>
    </header>
  );
};

export default HeaderAuth;
