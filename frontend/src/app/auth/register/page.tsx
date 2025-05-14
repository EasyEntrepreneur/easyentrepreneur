'use client';

import { useState } from 'react';
import HeaderAuth from '@/components/HeaderAuth';
import styles from './page.module.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // ✅ nouveau

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(''); // reset erreur

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email, password }),
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();

    if (res.ok) {
      window.location.href = '/auth/login';
    } else {
      setErrorMessage(data?.error || "Erreur lors de l'inscription");
    }
  };

  return (
    <>
      <HeaderAuth />
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <h2 className={styles.title}>Créer un compte</h2>
          <form onSubmit={handleRegister} className={styles.form}>
            <label>
              Prénom
              <input
                type="text"
                placeholder='Entrez votre Prénom'
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </label>

            <label>
              Nom
              <input
                type="text"
                placeholder='Entrez votre nom'
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </label>

            <label>
              Email
              <input
                type="email"
                placeholder='Entrez votre email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label>
              Mot de passe
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Entrez votre mot de passe'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.togglePassword}
                  aria-label="Afficher ou masquer le mot de passe"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </label>

            {/* ✅ Message d'erreur visible */}
            {errorMessage && (
              <p style={{ color: 'red', fontSize: '0.875rem', marginTop: '8px' }}>
                {errorMessage}
              </p>
            )}

            <button type="submit" className={styles.submit}>S'inscrire</button>
            <p className={styles.footerText}>
              Déjà un compte ? <a href="/auth/login">Se connecter</a>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
