'use client';

import { useSession } from 'next-auth/react';
import styles from './StepConnexion.module.css';

export default function StepConnexion() {
  const { data: session } = useSession();

  if (!session?.user?.email) return null;

  return (
    <div className={styles.stepBox}>
      <div className={styles.stepHeader}>
        <span className={styles.stepNumber}>1</span>
        <h3 className={styles.stepTitle}>Connecté en tant que :</h3>
      </div>
      <p className={styles.userEmail}>{session.user.email}</p>
    </div>
  );
}
