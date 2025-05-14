// app/dashboard/layout.tsx
import UserSidebar from "./components/UserSidebar";
import styles from "../admin/admin.module.css";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.dashboard}>
      <UserSidebar />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
