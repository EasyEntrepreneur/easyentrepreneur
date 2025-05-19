'use client'

import { useState, useEffect } from 'react'
import styles from './factures.module.css'
import toast from "react-hot-toast"

type Facture = {
  id: string
  number: string
  clientName: string
  issuedAt: string
  totalTTC: number
  pdfUrl: string   // ex: /invoices/2024-033.pdf (API path)
  statut: 'Payée' | 'En attente' | 'Échouée'
}

// --------- Hook d’affichage du toast de succès après redirection ----------
function useEffectToastOnRedirect() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const toastData = sessionStorage.getItem("showInvoiceToast");
      if (toastData) {
        const { pdfUrl } = JSON.parse(toastData);
        if (pdfUrl) {
          toast.success(
            <span>
              Facture générée avec succès&nbsp;
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}${pdfUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#3b82f6", textDecoration: "underline" }}
              >
                Afficher
              </a>
            </span>,
            { duration: 5000 }
          );
        } else {
          toast.success("Facture générée avec succès !");
        }
        sessionStorage.removeItem("showInvoiceToast");
      }
    }
  }, []);
}

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'Tous' | 'Payée' | 'En attente' | 'Échouée'>('Tous');
  const [loading, setLoading] = useState(true);

  // Fetch factures au chargement
  useEffect(() => {
    const fetchFactures = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setFactures(
          data.map((f: any) => ({
            ...f,
            statut: f.statut || "Payée", // par défaut Payée si champ manquant
          }))
        );
      } catch (err) {
        toast.error("Impossible de charger les factures");
      }
      setLoading(false);
    };
    fetchFactures();
  }, []);

  useEffectToastOnRedirect();

  const filteredFactures = factures.filter((facture) => {
    const matchSearch = facture.clientName?.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filtreStatut === 'Tous' || facture.statut === filtreStatut;
    return matchSearch && matchStatut;
  });

  const chiffreAffaires = factures
    .filter((f) => f.statut === 'Payée')
    .reduce((total, f) => total + (f.totalTTC || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mes factures</h1>
        <button className={styles.createButton} onClick={() => window.location.href = "/dashboard/factures/nouvelle"}>
          Créer une facture
        </button>
      </div>

      <div className={styles.cards}>
        <div className={styles.card}>
          <p className="text-gray-600 mb-1">Chiffre d’affaires</p>
          <p className="text-2xl font-bold">{chiffreAffaires.toLocaleString('fr-FR')} €</p>
        </div>
        <div className={styles.card}>
          <p className="text-gray-600 mb-1">Nombre de factures générées</p>
          <p className="text-2xl font-bold">{factures.length}</p>
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
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>Chargement…</td>
              </tr>
            ) : filteredFactures.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1rem', color: '#aaa' }}>
                  Aucune facture trouvée.
                </td>
              </tr>
            ) : (
              filteredFactures.map((facture) => (
                <tr key={facture.id}>
                  <td>{facture.number}</td>
                  <td>{facture.clientName}</td>
                  <td>{facture.issuedAt ? new Date(facture.issuedAt).toLocaleDateString("fr-FR") : ''}</td>
                  <td>{facture.totalTTC?.toLocaleString('fr-FR')} €</td>
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
                      {facture.pdfUrl && (
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL}${facture.pdfUrl}`}
                          title="Afficher la facture PDF"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          📄
                        </a>
                      )}
                      <button title="Envoyer par mail">📧</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
