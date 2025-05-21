// File: Parametres.tsx
'use client'

import { useEffect, useState } from 'react'
import styles from './parametres.module.css'

export default function Parametres() {
  const [activeTab, setActiveTab] = useState<'personnel' | 'facturation' | 'entreprise'>('personnel')
  const [user, setUser] = useState<any>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // États pour activer/désactiver la modification de chaque champ
  const [editingEmail, setEditingEmail] = useState(false)
  const [editingPassword, setEditingPassword] = useState(false)

  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(null), 3500)
      return () => clearTimeout(timeout)
    }
  }, [message])

  const [form, setForm] = useState({
    name: '',
    lastname: '',
    email: '',
    password: '',
    billingName: '',
    billingLastname: '',
    billingEmail: '',
    billingCountry: '',
    billingAddress: '',
    billingZip: '',
    billingCity: '',
    billingCompany: '',
    billingVat: '',
    companyName: '',
    companyAddress: '',
    companyZip: '',
    companyCity: '',
    companySiret: '',
    companyVat: '',
    companyPhone: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return void (window.location.href = '/auth/login')

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async res => {
        if (!res.ok) throw new Error()
        const { user } = await res.json()
        setUser(user)
      })
      .catch(() => {
        localStorage.removeItem('token')
        window.location.href = '/auth/login'
      })
  }, [])

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.name || '',
        lastname: user.lastname || '',
        email: user.email || '',
      }))
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

      // 1) update-user
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/update-user`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: form.name,
          lastname: form.lastname,
          email: form.email,
          password: form.password,
        }),
      })

      // 2) update-billing
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/update-billing`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          billingName: form.billingName,
          billingLastname: form.billingLastname,
          billingEmail: form.billingEmail,
          billingCountry: form.billingCountry,
          billingAddress: form.billingAddress,
          billingZip: form.billingZip,
          billingCity: form.billingCity,
          billingCompany: form.billingCompany,
          billingVat: form.billingVat,
        }),
      })

      // 3) update-company
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/update-company`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          companyName: form.companyName,
          companyAddress: form.companyAddress,
          companyZip: form.companyZip,
          companyCity: form.companyCity,
          companySiret: form.companySiret,
          companyVat: form.companyVat,
          companyPhone: form.companyPhone,
        }),
      })

      setMessage({ type: 'success', text: 'Modifications enregistrées ✅' })
      // repasser en lecture seule
      setEditingEmail(false)
      setEditingPassword(false)
    } catch (err) {
      console.error('Erreur mise à jour :', err)
      setMessage({ type: 'error', text: "Erreur lors de l'enregistrement." })
    }
  }

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.card}>
        {message && (
          <div className={message.type === 'success' ? styles.successMsg : styles.errorMsg}>
            {message.text}
          </div>
        )}

        <div className={styles.tabHeader}>
          <button
            type="button"
            onClick={() => setActiveTab('personnel')}
            className={activeTab === 'personnel' ? styles.active : ''}
          >
            Informations personnelles
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('facturation')}
            className={activeTab === 'facturation' ? styles.active : ''}
          >
            Informations de facturation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('entreprise')}
            className={activeTab === 'entreprise' ? styles.active : ''}
          >
            Informations de votre entreprise
          </button>
        </div>

        {activeTab === 'personnel' && (
          <div className={styles.section}>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Prénom"
            />
            <input
              name="lastname"
              value={form.lastname}
              onChange={handleChange}
              placeholder="Nom"
            />

            {/* Champ Email + bouton dédié */}
            <div className={styles.inlineGroup}>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="Email"
                readOnly={!editingEmail}
                className={editingEmail ? '' : styles.readOnly}
              />
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => setEditingEmail(prev => !prev)}
              >
                {editingEmail ? 'Annuler' : 'Modifier'}
              </button>
            </div>

            {/* Champ Mot de passe + bouton dédié */}
            <div className={styles.inlineGroup}>
              <input
                name="password"
                value={form.password}
                onChange={handleChange}
                type="password"
                placeholder="*****************"
                readOnly={!editingPassword}
                className={editingPassword ? '' : styles.readOnly}
              />
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => setEditingPassword(prev => !prev)}
              >
                {editingPassword ? 'Annuler' : 'Modifier'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'facturation' && (
          <div className={styles.section}>
            {/* ... votre code facturation inchangé ... */}
          </div>
        )}

        {activeTab === 'entreprise' && (
          <div className={styles.section}>
            {/* ... votre code entreprise inchangé ... */}
          </div>
        )}

        <button type="submit" className={styles.saveBtn}>
          Enregistrer toutes les modifications
        </button>
      </form>
    </div>
  )
}
