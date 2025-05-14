// app/dashboard/components/UserKpiCards.tsx
import styles from "../../admin/admin.module.css";

type Props = {
  documentsGenerated: number;
  remainingAI: number;
  revenue?: number;
};

export default function UserKpiCards({ documentsGenerated, remainingAI, revenue = 0 }: Props) {
  return (
    <div className={styles.kpis}>
      <div className={styles.kpiCard}>
        <h3>{revenue.toLocaleString()} €</h3>
        <p>Chiffre d’affaire</p>
      </div>
      <div className={styles.kpiCard}>
        <h3>{documentsGenerated}</h3>
        <p>Documents générés</p>
      </div>
      <div className={styles.kpiCard}>
        <h3>{remainingAI}</h3>
        <p>Requêtes IA restantes</p>
      </div>
    </div>
  );
}
