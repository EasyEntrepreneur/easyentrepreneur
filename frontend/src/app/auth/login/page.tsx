'use client';

import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import HeaderAuth from '@/components/HeaderAuth';
import styles from './page.module.css';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!process.env.NEXT_PUBLIC_API_URL) {
      toast.error("Problème de configuration serveur.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Email ou mot de passe invalide.');
        setLoading(false);
        return;
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        toast.success('Connexion réussie ! Redirection...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 700); // petit délai pour voir le toast
        toast.error("Réponse inattendue du serveur.");
      }
    } catch (err) {
      toast.error('Erreur serveur. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HeaderAuth />
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <h2 className={styles.title}>Connexion</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <label>Email
              <input
                type="email"
                placeholder='Entrez votre email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label>Mot de passe
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Entrez votre mot de passe'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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

            {/* On peut garder l'affichage du message d'erreur sous le formulaire si tu veux */}
            {/* {error && <p className={styles.error}>{error}</p>} */}

            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>

            <p className={styles.footerText}>
              Pas encore de compte ? <a href="/auth/register">Créer un compte</a>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
