'use client'

import { useEffect, useState } from 'react'
import styles from './parametres.module.css'

export default function Parametres() {
  const [activeTab, setActiveTab] = useState<'personnel' | 'facturation' | 'entreprise'>('personnel')
  const [user, setUser] = useState<any>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => {
        setMessage(null)
      }, 3500)
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
    if (!token) {
      window.location.href = '/auth/login'
      return
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const data = await res.json()
        setUser(data.user)
      })
      .catch(() => {
        localStorage.removeItem('token')
        window.location.href = '/auth/login'
      })
  }, [])

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || '',
        lastname: user.lastname || '',
        email: user.email || '',
      }))
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

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
          <button type="button" onClick={() => setActiveTab('personnel')} className={activeTab === 'personnel' ? styles.active : ''}>
            Informations personnelles
          </button>
          <button type="button" onClick={() => setActiveTab('facturation')} className={activeTab === 'facturation' ? styles.active : ''}>
            Informations de facturation
          </button>
          <button type="button" onClick={() => setActiveTab('entreprise')} className={activeTab === 'entreprise' ? styles.active : ''}>
            Informations de votre entreprise
          </button>
        </div>

        {activeTab === 'personnel' && (
          <div className={styles.section}>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Prénom" />
            <input name="lastname" value={form.lastname} onChange={handleChange} placeholder="Nom" />
            <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="Email" />
            <input name="password" value={form.password} onChange={handleChange} type="password" placeholder="Mot de passe (laisser vide si inchangé)" />
          </div>
        )}

        {activeTab === 'facturation' && (
          <div className={styles.section}>
            <div className={styles.inlineGroup}>
              <input name="billingName" value={form.billingName} onChange={handleChange} placeholder="Prénom" />
              <input name="billingLastname" value={form.billingLastname} onChange={handleChange} placeholder="Nom" />
            </div>
            <input name="billingEmail" value={form.billingEmail} onChange={handleChange} placeholder="Email" />
            <input name="billingCountry" value={form.billingCountry} onChange={handleChange} placeholder="Pays" />
            <input name="billingAddress" value={form.billingAddress} onChange={handleChange} placeholder="Adresse" />
            <div className={styles.inlineGroup}>
              <input name="billingZip" value={form.billingZip} onChange={handleChange} placeholder="Code postal" />
              <input name="billingCity" value={form.billingCity} onChange={handleChange} placeholder="Ville" />
            </div>
            <input name="billingCompany" value={form.billingCompany} onChange={handleChange} placeholder="Entreprise" />
            <input name="billingVat" value={form.billingVat} onChange={handleChange} placeholder="Numéro de TVA" />
          </div>
        )}

        {activeTab === 'entreprise' && (
          <div className={styles.section}>
            <input name="companyName" value={form.companyName} onChange={handleChange} placeholder="Nom / Société" />
            <input name="companyAddress" value={form.companyAddress} onChange={handleChange} placeholder="Adresse" />
            <div className={styles.inlineGroup}>
              <input name="companyZip" value={form.companyZip} onChange={handleChange} placeholder="Code postal" />
              <input name="companyCity" value={form.companyCity} onChange={handleChange} placeholder="Ville" />
            </div>
            <input name="companySiret" value={form.companySiret} onChange={handleChange} placeholder="SIRET" />
            <input name="companyVat" value={form.companyVat} onChange={handleChange} placeholder="Numéro TVA" />
            <input name="companyPhone" value={form.companyPhone} onChange={handleChange} placeholder="Téléphone" />
          </div>
        )}

        <button type="submit" className={styles.saveBtn}>
          Enregistrer toutes les modifications
        </button>
      </form>
    </div>
  )
}
