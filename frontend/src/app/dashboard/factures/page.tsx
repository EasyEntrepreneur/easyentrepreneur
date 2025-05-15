'use client'

import { useState } from 'react'
import styles from './factures.module.css'

type Facture = {
  id: string
  client: string
  date: string
  montant: number
  statut: 'Payée' | 'En attente' | 'Échouée'
}

const mockFactures: Facture[] = [
  { id: '#2024-005', client: 'Jean Martin', date: '2024-04-20', montant: 800, statut: 'Payée' },
  { id: '#2024-004', client: 'Sophie Durand', date: '2024-04-10', montant: 450, statut: 'En attente' },
  { id: '#2024-003', client: 'Pierre Lemaitre', date: '2024-04-02', montant: 1200, statut: 'Payée' },
  { id: '#2024-002', client: 'Alice Robert', date: '2024-03-25', montant: 300, statut: 'Échouée' },
  { id: '#2024-001', client: 'Thomas Bernard', date: '2024-03-20', montant: 550, statut: 'Payée' },
]

export default function FacturesPage() {
  const [search, setSearch] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<'Tous' | 'Payée' | 'En attente' | 'Échouée'>('Tous')

  const filteredFactures = mockFactures.filter((facture) => {
    const matchSearch = facture.client.toLowerCase().includes(search.toLowerCase())
    const matchStatut = filtreStatut === 'Tous' || facture.statut === filtreStatut
    return matchSearch && matchStatut
  })

  const chiffreAffaires = mockFactures
    .filter((f) => f.statut === 'Payée')
    .reduce((total, f) => total + f.montant, 0)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mes factures</h1>
        <button className={styles.createButton}>Créer une facture</button>
      </div>

      <div className={styles.cards}>
        <div className={styles.card}>
          <p className="text-gray-600 mb-1">Chiffre d’affaires</p>
          <p className="text-2xl font-bold">{chiffreAffaires.toLocaleString('fr-FR')} €</p>
        </div>
        <div className={styles.card}>
          <p className="text-gray-600 mb-1">Nombre de factures générées</p>
          <p className="text-2xl font-bold">{mockFactures.length}</p>
        </div>
      </div>

      <div className={styles.filtersBar}>
        <h2 className="text-xl font-semibold">Mes factures générées</h2>
        <div className={styles.filters}>
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value as any)}
            className={styles.select}
          >
            <option value="Tous">Tous</option>
            <option value="Payée">Payée</option>
            <option value="En attente">En attente</option>
            <option value="Échouée">Échouée</option>
          </select>
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Client</th>
              <th>Date</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFactures.map((facture) => (
              <tr key={facture.id}>
                <td>{facture.id}</td>
                <td>{facture.client}</td>
                <td>{facture.date}</td>
                <td>{facture.montant.toLocaleString('fr-FR')} €</td>
                <td>
                  <span
                    className={`${styles.status} ${
                      facture.statut === 'Payée'
                        ? styles.statusPayee
                        : facture.statut === 'En attente'
                        ? styles.statusAttente
                        : styles.statusEchouee
                    }`}
                  >
                    {facture.statut}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button title="Voir">📄</button>
                    <button title="Envoyer par mail">📧</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredFactures.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1rem', color: '#aaa' }}>
                  Aucune facture trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
