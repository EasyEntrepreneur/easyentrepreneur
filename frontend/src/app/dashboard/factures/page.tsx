'use client'

import { useState, useEffect } from 'react'
import styles from './factures.module.css'
import toast from "react-hot-toast"
import RevenueChart from '@/components/RevenueChart';

// Mapping entre enum (backend) et labels (frontend)
const STATUT_LABELS: Record<InvoiceStatus, string> = {
  PAYEE: 'Payée',
  EN_ATTENTE: 'En attente',
  ANNULE: 'Annulée'
};
type InvoiceStatus = 'PAYEE' | 'EN_ATTENTE' | 'ANNULE';

type Facture = {
  id: string
  number: string
  clientName: string
  issuedAt: string
  totalTTC: number
  pdfUrl: string
  statut: InvoiceStatus // ATTENTION : utilise bien l'enum, plus les labels
}

const STATUTS: { value: InvoiceStatus, label: string }[] = [
  { value: 'PAYEE', label: 'Payée' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'ANNULE', label: 'Annulée' }
];

const handleDownloadPdf = async (number: string) => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Veuillez vous reconnecter");
    return;
  }
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${number}/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Erreur lors du téléchargement du PDF");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Facture-${number}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    toast.error("Impossible de télécharger le PDF");
  }
};

const handleShowPdf = async (number: string) => {
  const token = localStorage.getItem("token");
  if (!token) {
    toast.error("Veuillez vous reconnecter");
    return;
  }
  try {
    // ⚠️ Il faut utiliser le endpoint correct !
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${number}/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Erreur lors du téléchargement du PDF");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");
    // Optionnel : révoquer l'URL après quelques secondes
    setTimeout(() => window.URL.revokeObjectURL(url), 5000);
  } catch (e) {
    toast.error("Impossible d'ouvrir le PDF");
  }
};


function useEffectToastOnRedirect(handleShowPdf: (number: string) => void) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const toastData = sessionStorage.getItem("showInvoiceToast");
      if (toastData) {
        const { number } = JSON.parse(toastData);
        if (number) {
          toast.success(
            <span>
              Facture générée avec succès&nbsp;
              <button
                style={{
                  color: "#3b82f6",
                  textDecoration: "underline",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  font: "inherit",
                }}
                onClick={() => handleShowPdf(number)}
              >
                Afficher
              </button>
            </span>,
            { duration: 7000 }
          );
        } else {
          toast.success("Facture générée avec succès !");
        }
        sessionStorage.removeItem("showInvoiceToast");
      }
    }
  }, [handleShowPdf]);
}

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'Tous' | InvoiceStatus>('Tous');
  const [loading, setLoading] = useState(true);
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);

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
            statut: f.statut || "EN_ATTENTE", // enum attendu !
          }))
        );
      } catch (err) {
        toast.error("Impossible de charger les factures");
      }
      setLoading(false);
    };
    fetchFactures();
  }, []);

  useEffectToastOnRedirect(handleShowPdf);

  // Filtres actifs
  const filteredFactures = factures.filter((facture) => {
    const matchSearch = facture.clientName?.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filtreStatut === 'Tous' || facture.statut === filtreStatut;
    return matchSearch && matchStatut;
  });

  // Affichage 5 dernières si pas de filtre ni recherche
  const visibleFactures =
    search.trim() === '' && filtreStatut === 'Tous'
      ? filteredFactures.slice(0, 5)
      : filteredFactures;

  const chiffreAffaires = factures
    .filter((f) => f.statut === 'PAYEE')
    .reduce((total, f) => total + (f.totalTTC || 0), 0);

  // Changement du statut
  const handleChangeStatut = async (facture: Facture, newStatut: InvoiceStatus) => {
    if (newStatut === facture.statut) {
      setDropdownOpenId(null);
      return;
    }
    // Optimistic UI
    setFactures(fs =>
      fs.map(f => f.id === facture.id ? { ...f, statut: newStatut } : f)
    );
    setDropdownOpenId(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${facture.id}/statut`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: newStatut }),
      });
      if (!res.ok) throw new Error();
      toast.success("Statut mis à jour !");
    } catch (e) {
      toast.error("Impossible de mettre à jour le statut");
      // Si erreur, remet l'ancien statut côté front
      setFactures(fs =>
        fs.map(f => f.id === facture.id ? { ...f, statut: facture.statut } : f)
      );
    }
  };

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

      <h2 className="text-xl font-semibold">Evolution du chiffre d'affaire</h2>
      <RevenueChart invoices={factures} />

      <div className={styles.filtersBar}>
        <h2 className="text-xl font-semibold">Mes factures générées</h2>
        <div className={styles.filters}>
          <select
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value as any)}
            className={styles.select}
          >
            <option value="Tous">Tous</option>
            {STATUTS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
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
            ) : visibleFactures.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '1rem', color: '#aaa' }}>
                  Aucune facture trouvée.
                </td>
              </tr>
            ) : (
              visibleFactures.map((facture) => (
                <tr key={facture.id}>
                  <td>{facture.number}</td>
                  <td>{facture.clientName}</td>
                  <td>{facture.issuedAt ? new Date(facture.issuedAt).toLocaleDateString("fr-FR") : ''}</td>
                  <td>{facture.totalTTC?.toLocaleString('fr-FR')} €</td>
                  <td>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <span
                        className={`${styles.status} ${
                          facture.statut === 'PAYEE'
                            ? styles.statusPayee
                            : facture.statut === 'EN_ATTENTE'
                            ? styles.statusAttente
                            : styles.statusAnnule
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setDropdownOpenId(dropdownOpenId === facture.id ? null : facture.id)}
                      >
                        {STATUT_LABELS[facture.statut]} ⌄
                      </span>
                      {/* Dropdown */}
                      {dropdownOpenId === facture.id && (
                        <ul
                          style={{
                            position: "absolute",
                            left: 0,
                            top: "120%",
                            background: "#fff",
                            boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
                            borderRadius: 8,
                            padding: 0,
                            margin: 0,
                            zIndex: 99,
                            minWidth: 120,
                            border: "1px solid #eee"
                          }}
                        >
                          {STATUTS.map((s) => (
                            <li
                              key={s.value}
                              style={{
                                padding: "8px 18px",
                                cursor: "pointer",
                                fontWeight: s.value === facture.statut ? "bold" : "normal",
                                color: s.value === facture.statut ? "#4f46e5" : "#222",
                                background: s.value === facture.statut ? "#f3f4f6" : "transparent"
                              }}
                              onClick={() => handleChangeStatut(facture, s.value)}
                            >
                              {s.label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleShowPdf(facture.number)}
                        title="Afficher la facture PDF"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.2em"
                        }}
                      >
                        📄
                      </button>
                      <button
                        onClick={() => handleDownloadPdf(facture.number)}
                        title="Télécharger la facture PDF"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.2em"
                        }}
                      >
                        ⬇️
                      </button>
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
