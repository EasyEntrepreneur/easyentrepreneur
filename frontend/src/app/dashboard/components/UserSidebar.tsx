"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "../../admin/admin.module.css";

const links = [
  { label: "Tableau de bord", href: "/dashboard" },
  { label: "Factures", href: "/dashboard/factures" },
  { label: "Devis", href: "/dashboard/devis" },
  { label: "Contrats", href: "/dashboard/contrats" },
  { label: "Assistant IA", href: "/dashboard/ia" },
  { label: "Support", href: "/dashboard/support" },
  { label: "Paramètres de compte", href: "/dashboard/parametres" },
];

const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/auth/login';
  };

export default function UserSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.logo}>EasyEntrepreneur</h2>
      <nav className={styles.nav}>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${pathname === link.href ? styles.active : ""}`}
          >
            {link.label}
          </Link>
        ))}
        <button onClick={handleLogout} className={styles.navItem}>
          Se déconnecter
        </button>
      </nav>
    </aside>
  );
}
