'use client'

import { useEffect, useState, useMemo } from 'react'
import styles from './parametres.module.css'

// regex simple pour email
const emailRegex = /^\S+@\S+\.\S+$/

// calcule la force : "faible" | "moyen" | "fort"
function getPasswordStrength(pw: string): 'faible' | 'moyen' | 'fort' {
  let score = 0
  if (pw.length >= 6) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[\W_]/.test(pw)) score++
  if (score <= 1) return 'faible'
  if (score === 2) return 'moyen'
  return 'fort'
}

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState<'personnel' | 'facturation' | 'entreprise'>('personnel')
  const [user, setUser] = useState<any>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [editingEmail, setEditingEmail] = useState(false)
  const [editingPassword, setEditingPassword] = useState(false)

  const [form, setForm] = useState({
    // personnels
    name: '',
    lastname: '',
    email: '',
    password: '',
    // facturation
    billingName: '',
    billingLastname: '',
    billingEmail: '',
    billingCountry: '',
    billingAddress: '',
    billingZip: '',
    billingCity: '',
    billingCompany: '',
    billingVat: '',
    // entreprise
    companyName: '',
    companyAddress: '',
    companyZip: '',
    companyCity: '',
    companySiret: '',
    companyVat: '',
    companyPhone: '',
  })

  // --- fetch user ---
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return void (window.location.href = '/auth/login')

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const { user } = await res.json()
        setUser(user)
      })
      .catch(() => {
        localStorage.removeItem('token')
        window.location.href = '/auth/login'
      })
  }, [])

  // --- préremplissage du form ---
  useEffect(() => {
    if (!user) return
    setForm((f) => ({
      ...f,
      name: user.name || '',
      lastname: user.lastname || '',
      email: user.email || '',
      billingName: user.billingName || '',
      billingLastname: user.billingLastname || '',
      billingEmail: user.billingEmail || '',
      billingCountry: user.billingCountry || '',
      billingAddress: user.billingAddress || '',
      billingZip: user.billingZip || '',
      billingCity: user.billingCity || '',
      billingCompany: user.billingCompany || '',
      billingVat: user.billingVat || '',
      companyName: user.companyName || '',
      companyAddress: user.companyAddress || '',
      companyZip: user.companyZip || '',
      companyCity: user.companyCity || '',
      companySiret: user.companySiret || '',
      companyVat: user.companyVat || '',
      companyPhone: user.companyPhone || '',
    }))
  }, [user])

  // --- timeout des toasts ---
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 3500)
    return () => clearTimeout(t)
  }, [message])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  // valeurs dérivées pour email & mot de passe
  const emailValid = useMemo(() => emailRegex.test(form.email), [form.email])
  const pwdStrength = useMemo(
    () => (editingPassword ? getPasswordStrength(form.password) : null),
    [form.password, editingPassword]
  )

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
      setEditingEmail(false)
      setEditingPassword(false)
    } catch (err) {
      console.error(err)
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

            <div className={styles.inlineGroup}>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                readOnly={!editingEmail}
                className={[
                  !editingEmail && styles.readOnly,
                  editingEmail && (emailValid ? styles.emailValid : styles.emailInvalid),
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
              
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => setEditingEmail((v) => !v)}
              >
                {editingEmail ? 'Annuler' : 'Modifier'}
              </button>
            </div>

            <div className={styles.inlineGroup}>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Mot de passe (laisser vide si inchangé)"
                readOnly={!editingPassword}
                className={[
                  !editingPassword && styles.readOnly,
                  editingPassword &&
                    pwdStrength === 'faible' &&
                    styles.pwdFaibleBg,
                  editingPassword &&
                    pwdStrength === 'moyen' &&
                    styles.pwdMoyenBg,
                  editingPassword &&
                    pwdStrength === 'fort' &&
                    styles.pwdFortBg,
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => setEditingPassword((v) => !v)}
              >
                {editingPassword ? 'Annuler' : 'Modifier'}
              </button>
            </div>
            {editingPassword && (
              <>
                <div className={styles.strengthMeter}>
                  <div
                    className={[
                      styles.strengthBar,
                      pwdStrength === 'faible' && styles.strengthFaible,
                      pwdStrength === 'moyen' && styles.strengthMoyen,
                      pwdStrength === 'fort' && styles.strengthFort,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                </div>
                <small className={styles.strengthLabel}>
                  Force : {pwdStrength}
                </small>
              </>
            )}
          </div>
        )}

        {activeTab === 'facturation' && (
          <div className={styles.section}>
            <div className={styles.inlineGroup}>
              <input
                name="billingName"
                value={form.billingName}
                onChange={handleChange}
                placeholder="Prénom"
              />
              <input
                name="billingLastname"
                value={form.billingLastname}
                onChange={handleChange}
                placeholder="Nom"
              />
            </div>
            <input
              name="billingEmail"
              value={form.billingEmail}
              onChange={handleChange}
              placeholder="Email"
            />
            <input
              name="billingCountry"
              value={form.billingCountry}
              onChange={handleChange}
              placeholder="Pays"
            />
            <input
              name="billingAddress"
              value={form.billingAddress}
              onChange={handleChange}
              placeholder="Adresse"
            />
            <div className={styles.inlineGroup}>
              <input
                name="billingZip"
                value={form.billingZip}
                onChange={handleChange}
                placeholder="Code postal"
              />
              <input
                name="billingCity"
                value={form.billingCity}
                onChange={handleChange}
                placeholder="Ville"
              />
            </div>
            <input
              name="billingCompany"
              value={form.billingCompany}
              onChange={handleChange}
              placeholder="Entreprise"
            />
            <input
              name="billingVat"
              value={form.billingVat}
              onChange={handleChange}
              placeholder="Numéro de TVA"
            />
          </div>
        )}

        {activeTab === 'entreprise' && (
          <div className={styles.section}>
            <input
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              placeholder="Nom / Société"
            />
            <input
              name="companyAddress"
              value={form.companyAddress}
              onChange={handleChange}
              placeholder="Adresse"
            />
            <div className={styles.inlineGroup}>
              <input
                name="companyZip"
                value={form.companyZip}
                onChange={handleChange}
                placeholder="Code postal"
              />
              <input
                name="companyCity"
                value={form.companyCity}
                onChange={handleChange}
                placeholder="Ville"
              />
            </div>
            <input
              name="companySiret"
              value={form.companySiret}
              onChange={handleChange}
              placeholder="SIRET"
            />
            <input
              name="companyVat"
              value={form.companyVat}
              onChange={handleChange}
              placeholder="Numéro TVA"
            />
            <input
              name="companyPhone"
              value={form.companyPhone}
              onChange={handleChange}
              placeholder="Téléphone"
            />
          </div>
        )}

        <button type="submit" className={styles.saveBtn}>
          Enregistrer toutes les modifications
        </button>
      </form>
    </div>
  )
}