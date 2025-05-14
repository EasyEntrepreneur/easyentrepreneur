'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { FaUserCircle } from 'react-icons/fa';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Ferme le menu si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={styles.navbar}>
      <h1 className={styles.logo}>EasyEntrepreneur</h1>

      <nav className={styles.navLinks}>
        <a href="#accueil">Accueil</a>
        <a href="#comment">Comment ça marche</a>
        <a href="#faq">FAQ</a>
        <a href="#contact">Contact</a>
        <span className={styles.separator}>|</span>

        {session?.user ? (
          <div className={styles.userMenuWrapper} ref={menuRef}>
            <FaUserCircle
              size={22}
              className={styles.icon}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            />
            {isDropdownOpen && (
              <div className={styles.dropdown}>
                <p className={styles.dropdownText}>
                  Bonjour, {session.user.name || 'utilisateur'}
                </p>
                {session?.user?.role === 'ADMIN' && (
                  <Link href="/admin">Panneau Admin</Link>
                )}
                <Link href="/dashboard">Tableau de bord</Link>
                <button onClick={() => signOut()} className={styles.logout}>
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/auth/login" className={styles.loginLink}>
            Connexion
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
