import styles from "./FeatureCard.module.css";

export type Plan = "FREEMIUM" | "BASIC" | "STANDARD" | "PREMIUM";


type Props = {
  label: string;
  description: string;
  icon: React.ReactNode;
  requiredPlan: Plan;
  currentPlan: Plan;
};

export default function FeatureCard({ label, description, icon, requiredPlan, currentPlan }: Props) {
  const locked = planRank(currentPlan) < planRank(requiredPlan);

  return (
    <div className={`${styles.card} ${locked ? styles.locked : ""}`}>
      <div className={styles.icon}>{icon}</div>
      <h3>{label}</h3>
      <p>{description}</p>
      <button disabled={locked} className={styles.button}> {locked ? "Offre supérieure requise" : "Accéder"} </button>
    </div>
  );
}

function planRank(plan: Plan): number {
  return ["FREEMIUM", "BASIC", "STANDARD", "PREMIUM"].indexOf(plan);
}
