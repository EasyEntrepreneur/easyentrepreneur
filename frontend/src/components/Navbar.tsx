'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FaUserCircle } from 'react-icons/fa';
import styles from './Navbar.module.css';

type User = {
  name?: string;
  email: string;
  role?: string;
};

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Récupère le token et les infos utilisateur
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      });
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/auth/login';
  };

  return (
    <header className={styles.navbar}>
      <h1 className={styles.logo}>EasyEntrepreneur</h1>

      <nav className={styles.navLinks}>
        <a href="#accueil">Accueil</a>
        <a href="#comment">Comment ça marche</a>
        <a href="#faq">FAQ</a>
        <a href="#contact">Contact</a>
        <span className={styles.separator}>|</span>

        {user ? (
          <div className={styles.userMenuWrapper} ref={menuRef}>
            <FaUserCircle
              size={22}
              className={styles.icon}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            />
            {isDropdownOpen && (
              <div className={styles.dropdown}>
                <p className={styles.dropdownText}>
                  Bonjour, {user.name || 'utilisateur'}
                </p>
                {user.role === 'ADMIN' && (
                  <Link href="/admin">Panneau Admin</Link>
                )}
                <Link href="/dashboard">Tableau de bord</Link>
                <button onClick={handleLogout} className={styles.logout}>
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
