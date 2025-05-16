'use client';

import { useEffect, useState } from 'react';
import styles from '../admin/admin.module.css';
import FeatureGrid from './components/FeatureGrid';
import UserKpiCards from './components/UserKpiCards';
import { PlanProvider } from './context/PlanContext';

type User = {
  id: string;
  name: string | null;
  email: string;
  currentPlan: string;
  documents: any[];
};

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      });
  }, []);

  if (!user) return <p>Chargement...</p>;

  const fakeRevenue = 1200;
  const remainingAI = user.currentPlan === 'FREEMIUM' ? 5 : Infinity;
  const documentsGenerated = user.documents?.length || 0;

  return (
    <div className={styles.dashboard}>

      <main className={styles.content}>
        <h1 className={styles.title}>Bonjour, {user.name || user.email} !</h1>
        <p className={styles.subtitle}>
          Plan actuel : <strong>{user.currentPlan}</strong>
        </p>

        <PlanProvider plan={user.currentPlan}>
          <UserKpiCards
            documentsGenerated={documentsGenerated}
            remainingAI={remainingAI}
            revenue={fakeRevenue}
          />
          <FeatureGrid currentPlan={user.currentPlan} />
        </PlanProvider>
      </main>
    </div>
  );
}
