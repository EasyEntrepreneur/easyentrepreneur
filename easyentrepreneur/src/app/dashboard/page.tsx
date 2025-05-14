// ✅ app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import styles from "../admin/admin.module.css";
import { prisma } from "@/lib/prisma";
import FeatureGrid from "./components/FeatureGrid";
import UserSidebar from "./components/UserSidebar"; // si fichier minuscule
import UserKpiCards from "./components/UserKpiCards";
import { PlanProvider } from "./context/PlanContext";

export default async function UserDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      documents: true,
    },
  });

  if (!user) redirect("/");

  const fakeRevenue = 1200;
  const remainingAI = user.currentPlan === "FREEMIUM" ? 5 : Infinity;
  const documentsGenerated = user.documents.length;

  return (
    <div className={styles.dashboard}>
      <UserSidebar />

      <main className={styles.content}>
        <h1 className={styles.title}>Bonjour, {user.name} !</h1>
        <p className={styles.subtitle}>Plan actuel : <strong>{user.currentPlan}</strong></p>

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
