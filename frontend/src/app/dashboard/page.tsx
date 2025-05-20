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

type Invoice = {
  montant: number;
  statut: string;
};

const PLAN_LABELS: Record<string, string> = {
  FREEMIUM: "Freemium",
  BASIC: "Basique",
  STANDARD: "Standard",
  PREMIUM: "Premium",
};

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [revenue, setRevenue] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }

    // Récupère les infos user
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

  // Récupère les factures pour le chiffre d'affaire
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        // On additionne uniquement les factures "Payée"
        const total = (data.invoices || data).reduce((sum: number, inv: Invoice) => {
          return inv.statut === "Payée" ? sum + (Number(inv.montant) || 0) : sum;
        }, 0);
        setRevenue(total);
        setLoading(false);
      })
      .catch(() => {
        setRevenue(0);
        setLoading(false);
      });
  }, [user]);

  if (!user || loading) return <p>Chargement...</p>;

  const remainingAI = user.currentPlan === 'FREEMIUM' ? 5 : Infinity;
  const documentsGenerated = user.documents?.length || 0;
  const planLabel = PLAN_LABELS[user.currentPlan] || user.currentPlan;

  return (
    <div className={styles.dashboard}>
      <main className={styles.content}>
        <h1 className={styles.title}>Bonjour, {user.name || user.email} !</h1>
        <p className={styles.subtitle}>
          Plan actuel : <strong>{planLabel}</strong>
        </p>

        <PlanProvider plan={user.currentPlan}>
          <UserKpiCards
            documentsGenerated={documentsGenerated}
            remainingAI={remainingAI}
            revenue={revenue}
          />
          <FeatureGrid currentPlan={user.currentPlan} />
        </PlanProvider>
      </main>
    </div>
  );
}
