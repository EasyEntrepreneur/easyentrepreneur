// utils/featureAccess.ts

export type Plan = "FREEMIUM" | "BASIC" | "STANDARD" | "PREMIUM";

export type Feature = {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  requiredPlan: Plan;
};

export const features: Feature[] = [
  {
    key: "invoice",
    label: "Générer une facture",
    description: "Créez vos factures en quelques clics.",
    icon: "📄",
    requiredPlan: "FREEMIUM",
  },
  {
    key: "quote",
    label: "Générer un devis",
    description: "Éditez facilement vos devis clients.",
    icon: "📑",
    requiredPlan: "FREEMIUM",
  },
  {
    key: "ai_request",
    label: "Assistant IA",
    description: "Laissez l’IA vous aider dans vos démarches.",
    icon: "🤖",
    requiredPlan: "FREEMIUM",
  },
  {
    key: "contract",
    label: "Contrats personnalisés",
    description: "Générez des contrats adaptés à vos besoins.",
    icon: "📜",
    requiredPlan: "STANDARD",
  },
  {
    key: "export",
    label: "Export Excel",
    description: "Exportez toutes vos données en 1 clic.",
    icon: "📊",
    requiredPlan: "STANDARD",
  },
];
