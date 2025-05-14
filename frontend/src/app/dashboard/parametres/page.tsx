// ✅ app/dashboard/parametres/SettingsForm.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import styles from "./SettingsForm.module.css";

export default function SettingsForm() {
  const { data: session } = useSession();
  const user = session?.user;

  const [form, setForm] = useState({
    name: user?.name || "",
    lastname: user?.lastname || "",
    email: user?.email || "",
    password: "",
    billingName: "",
    billingLastname: "",
    billingEmail: "",
    billingCountry: "",
    billingAddress: "",
    billingZip: "",
    billingCity: "",
    billingCompany: "",
    billingVat: "",
    companyName: "",
    companyAddress: "",
    companyZip: "",
    companyCity: "",
    companySiret: "",
    companyVat: "",
    companyPhone: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Données envoyées :", form);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      <section className={styles.settingsSection}>
        <h2>Informations personnelles</h2>
        <div className={styles.settingsGrid}>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Prénom" className={styles.settingsInput} />
          <input name="lastname" value={form.lastname} onChange={handleChange} placeholder="Nom" className={styles.settingsInput} />
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" className={styles.settingsInput} />
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Mot de passe (laisser vide si inchangé)" className={styles.settingsInput} />
        </div>
      </section>

      <section className={styles.settingsSection}>
        <h2>Informations de facturation</h2>
        <div className={styles.settingsGrid}>
          <input name="billingName" placeholder="Prénom" onChange={handleChange} className={styles.settingsInput} />
          <input name="billingLastname" placeholder="Nom" onChange={handleChange} className={styles.settingsInput} />
          <input name="billingEmail" type="email" placeholder="Email" onChange={handleChange} className={styles.settingsInput} />
          <input name="billingCountry" placeholder="Pays" onChange={handleChange} className={styles.settingsInput} />
          <input name="billingAddress" placeholder="Adresse" onChange={handleChange} className={styles.settingsInput} />
          <input name="billingZip" placeholder="Code postal" onChange={handleChange} className={styles.settingsInput} />
          <input name="billingCity" placeholder="Ville" onChange={handleChange} className={styles.settingsInput} />
          <input name="billingCompany" placeholder="Entreprise" onChange={handleChange} className={styles.settingsInput} />
          <input name="billingVat" placeholder="Numéro de TVA" onChange={handleChange} className={styles.settingsInput} />
        </div>
      </section>

      <section className={styles.settingsSection}>
        <h2>Informations de votre entreprise</h2>
        <div className={styles.settingsGrid}>
          <input name="companyName" placeholder="Nom / Société" onChange={handleChange} className={styles.settingsInput} />
          <input name="companyAddress" placeholder="Adresse" onChange={handleChange} className={styles.settingsInput} />
          <input name="companyZip" placeholder="Code postal" onChange={handleChange} className={styles.settingsInput} />
          <input name="companyCity" placeholder="Ville" onChange={handleChange} className={styles.settingsInput} />
          <input name="companySiret" placeholder="SIRET" onChange={handleChange} className={styles.settingsInput} />
          <input name="companyVat" placeholder="Numéro TVA" onChange={handleChange} className={styles.settingsInput} />
          <input name="companyPhone" placeholder="Téléphone" onChange={handleChange} className={styles.settingsInput} />
        </div>
      </section>

      <button type="submit" className={styles.settingsButton}>
        Enregistrer toutes les modifications
      </button>
    </form>
  );
}