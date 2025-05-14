import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import styles from "./admin.module.css";
import { prisma } from "@/lib/prisma";
import { FaUser, FaFileAlt, FaMoneyBill, FaCog, FaChartBar, FaSignOutAlt } from "react-icons/fa";
import LogoutButton from "@/components/LogoutButton";
import RevenueChart from "@/components/RevenueChart";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true},
  });

  const fakePaiements = [
    {
        id: "pay_001",
        user: "Thomas Bonaldi",
        montant: 1200,
        date: "2025-05-09",
        statut: "Réussi",
    },
    {
        id: "pay_002",
        user: "Emma Dubois",
        montant: 50,
        date: "2025-05-08",
        statut: "En attente",
    },
    {
        id: "pay_003",
        user: "Jean Dupont",
        montant: 30,
        date: "2025-05-07",
        statut: "Échoué",
    },
    ];
  const fakeDocuments = [
    {
        id: "doc_001",
        type: "Attestation URSSAF",
        user: "Thomas Bonaldi",
        date: "2025-05-09",
    },
    {
        id: "doc_002",
        type: "Facture auto-entrepreneur",
        user: "Emma Dubois",
        date: "2025-05-08",
    },
    {
        id: "doc_003",
        type: "Déclaration mensuelle",
        user: "Jean Dupont",
        date: "2025-05-07",
    },
    ];

  const fakePayments = [300, 1200, 50];

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <h2 className={styles.logo}>EasyEntrepreneur</h2>
        <nav className={styles.nav}>
          <a className={styles.active}><FaChartBar /> Tableau de bord</a>
          <a><FaUser /> Utilisateurs</a>
          <a><FaMoneyBill /> Paiements</a>
          <a><FaFileAlt /> Activité</a>
          <a><FaCog /> Paramètres</a>
          <LogoutButton className={styles.navItem} />
        </nav>
      </aside>

      <main className={styles.content}>
        <h1 className={styles.title}>Bonjour, {session.user.name} !</h1>
        <p className={styles.subtitle}>Bienvenue sur votre espace administrateur.</p>

        <div className={styles.kpis}>
          <div className={styles.kpiCard}>
            <h3>14 200 €</h3>
            <p>Chiffre d’affaire</p>
          </div>
          <div className={styles.kpiCard}>
            <h3>{users.length}</h3>
            <p>Utilisateurs</p>
          </div>
          <div className={styles.kpiCard}>
            <h3>87</h3>
            <p>Documents générés</p>
          </div>
        </div>

        <div className={styles.sections}>
            <div className={styles.section}>
                <RevenueChart />
            </div>
        </div>

        <div className={styles.sections}>
          <div className={styles.section}>
            <h2>Utilisateurs</h2>
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Inscription</th>
                  <th>Rôle</th>  
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td><span className={styles.roleBadge}>{user.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.row}>
            <div className={styles.section}>
              <h2>Paiements récents</h2>
              <ul className={styles.list}>
                {fakePayments.map((amount, i) => (
                  <li key={i} className={styles.listItem}>€ {amount}</li>
                ))}
              </ul>
            </div>

            <div className={styles.section}>
                <h2>Derniers documents générés</h2>
                <table className={styles.userTable}>
                    <thead>
                    <tr>
                        <th>Type</th>
                        <th>Utilisateur</th>
                        <th>Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    {fakeDocuments.map((doc) => (
                        <tr key={doc.id}>
                        <td>{doc.type}</td>
                        <td>{doc.user}</td>
                        <td>{new Date(doc.date).toLocaleDateString('fr-FR')}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.section}>
                <h2>Paiements récents</h2>
                <table className={styles.userTable}>
                    <thead>
                    <tr>
                        <th>Utilisateur</th>
                        <th>Montant</th>
                        <th>Date</th>
                        <th>Statut</th>
                    </tr>
                    </thead>
                    <tbody>
                    {fakePaiements.map((p) => (
                        <tr key={p.id}>
                        <td>{p.user}</td>
                        <td>€ {p.montant}</td>
                        <td>{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                        <td>
                            <span
                            className={
                                p.statut === "Réussi"
                                ? styles.statutSuccess
                                : p.statut === "En attente"
                                ? styles.statutPending
                                : styles.statutFailed
                            }
                            >
                            {p.statut}
                            </span>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
