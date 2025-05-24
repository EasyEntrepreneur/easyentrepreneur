import { features } from "@/utils/featureAccess";
import FeatureCard from "./FeatureCard";

export type Plan = "FREEMIUM" | "BASIC" | "STANDARD" | "PREMIUM";

export default function FeatureGrid({ currentPlan }: { currentPlan: Plan }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {features.map((feature) => (
        <FeatureCard
          key={feature.key}
          label={feature.label}
          description={feature.description}
          icon={feature.icon}
          requiredPlan={feature.requiredPlan}
          currentPlan={currentPlan}
        />
      ))}
    </div>
  );
}
