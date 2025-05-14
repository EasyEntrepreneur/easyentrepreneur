'use client';

import { useState } from 'react';
import HeaderAuth from '@/components/HeaderAuth';
import styles from './page.module.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ name: firstName, lastname: lastName, email, password }),
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (res.ok) {
        window.location.href = '/auth/login';
      } else {
        setErrorMessage(data?.error || "Erreur lors de l'inscription");
      }
    } catch (err) {
      console.error('Erreur réseau :', err);
      setErrorMessage("Erreur de connexion au serveur. Veuillez réessayer.");
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