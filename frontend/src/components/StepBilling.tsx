'use client';

import { useState } from 'react';
import styles from './StepBilling.module.css';

interface StepBillingProps {
  onSuccess: () => void;
  onEdit: () => void;
  userId: string; // ✅ ajouté ici
}

export default function StepBilling({ onSuccess, onEdit, userId }: StepBillingProps) {
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    email: '',
    country: '',
    address1: '',
    city: '',
    zip: '',
    company: '',
    vat: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/billing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log('Réponse API:', data);

      if (data.success) {
        setIsSubmitted(true);
        onSuccess();
      } else {
        alert("Erreur lors de l'enregistrement");
      }
    } catch (err) {
      alert("Erreur réseau ou serveur");
      console.error(err);
    }
  };
  
  if (isSubmitted) {
    return (
      <div className={styles.billingRecap}>
        <div className={styles.recapHeader}>
          <div></div>
          <button onClick={() => { setIsSubmitted(false); onEdit(); }} className={styles.editButton}>
            Modifier
          </button>
        </div>
        <p>{formData.name} {formData.lastname}</p>
        <p>{formData.address1}</p>
        <p>{formData.zip} {formData.city}</p>
        <p>{formData.country}</p>
        <p>{formData.email}</p>
      </div>
    );
  }

  return (
    <form className={styles.billingForm} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div className={styles.inputGroup}>
          <label>Prénom *</label>
          <input type="text" name="name" required value={formData.name} onChange={handleChange} />
        </div>
        <div className={styles.inputGroup}>
          <label>Nom *</label>
          <input type="text" name="lastname" required value={formData.lastname} onChange={handleChange} />
        </div>
        <div className={styles.inputGroup}>
          <label>Email *</label>
          <input type="email" name="email" required value={formData.email} onChange={handleChange} />
        </div>
        <div className={styles.inputGroup}>
          <label>Pays *</label>
          <select name="country" required value={formData.country} onChange={handleChange}>
            <option value="">-- Sélectionner --</option>
            <option value="France">France</option>
            <option value="Belgique">Belgique</option>
            <option value="Suisse">Suisse</option>
          </select>
        </div>
        <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
          <label>Adresse *</label>
          <input type="text" name="address1" required value={formData.address1} onChange={handleChange} />
        </div>
        <div className={styles.inputGroup}>
          <label>Ville *</label>
          <input type="text" name="city" required value={formData.city} onChange={handleChange} />
        </div>
        <div className={styles.inputGroup}>
          <label>Code postal *</label>
          <input type="text" name="zip" required value={formData.zip} onChange={handleChange} />
        </div>
        <div className={styles.inputGroup}>
          <label>Nom de l'entreprise (optionnel)</label>
          <input type="text" name="company" value={formData.company} onChange={handleChange} />
        </div>
        <div className={styles.inputGroup}>
          <label>Numéro de TVA (optionnel)</label>
          <input type="text" name="vat" value={formData.vat} onChange={handleChange} />
        </div>
      </div>

      <button type="submit" className={styles.submitButton}>
        Enregistrer les informations
      </button>
    </form>
  );
}
