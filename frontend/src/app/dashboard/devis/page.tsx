'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './devis.module.css'
import toast from "react-hot-toast"
import RevenueChart from '@/components/RevenueChart'

// STATUTS POUR DEVIS
type QuoteStatus = 'ACCEPTE' | 'EN_ATTENTE' | 'REFUSE';
const STATUT_LABELS: Record<QuoteStatus, string> = {
  ACCEPTE: 'Accepté',
  EN_ATTENTE: 'En attente',
  REFUSE: 'Refusé'
};

type Devis = {
  id: string
  number: string
  clientName: string
  issuedAt: string
  totalTTC: number
  statut: QuoteStatus
}

type QuotaInfo = {
  used: number
  max: number
  offer: string
};

const STATUTS: { value: QuoteStatus, label: string }[] = [
  { value: 'ACCEPTE', label: 'Accepté' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'REFUSE', label: 'Refusé' }
];

// Affiche le PDF dans un nouvel onglet avec toast
const handleShowOrDownloadPdf = async (id: string, number: string) => {
  const token = localStorage.getItem("token")
  if (!token) {
    toast.error("Veuillez vous reconnecter")
    return
  }
  try {
    const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/quotes/${id}/pdf`
    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Impossible de récupérer le PDF")
    const blob = await res.blob()
    const pdfUrl = window.URL.createObjectURL(blob)
    window.open(pdfUrl, '_blank')
    toast.success("PDF généré et affiché !")
    // Pour download auto :
    // const link = document.createElement('a')
    // link.href = pdfUrl
    // link.download = `Devis-${number}.pdf`
    // link.click()
  } catch (e) {
    toast.error("Erreur lors de la récupération du PDF")
  }
}

function showConfirmToast(message: string, onConfirm: () => void) {
  toast(
    (t) => (
      <span>
        {message}
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button
            style={{
              background: "#ef4444", color: "#fff", border: "none", borderRadius: 4, padding: "4px 12px", cursor: "pointer"
            }}
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm();
            }}
          >
            Oui, supprimer
          </button>
          <button
            style={{
              background: "#f3f4f6", color: "#222", border: "none", borderRadius: 4, padding: "4px 12px", cursor: "pointer"
            }}
            onClick={() => toast.dismiss(t.id)}
          >
            Annuler
          </button>
        </div>
      </span>
    ),
    { duration: 6000 }
  );
}

function useEffectToastOnRedirect(showPdf: (id: string, number: string) => void) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const toastData = sessionStorage.getItem("showQuoteToast");
      if (toastData) {
        const { id, number } = JSON.parse(toastData);
        if (id && number) {
          toast.success(
            <span>
              Devis généré avec succès&nbsp;
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
                onClick={() => handleShowOrDownloadPdf(id, number)}
              >
                Afficher
              </button>
            </span>,
            { duration: 7000 }
          );
        } else {
          toast.success("Devis généré avec succès !");
        }
        sessionStorage.removeItem("showQuoteToast");
      }
    }
  }, [showPdf]);
}

// ------------- PAGE -------------
export default function DevisPage() {
  const [devis, setDevis] = useState<Devis[]>([]);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<'Tous' | QuoteStatus>('Tous');
  const [loading, setLoading] = useState(true);
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  // Callback stable
  const handleShowPdf = useCallback((id: string, number: string) => {
    handleShowOrDownloadPdf(id, number)
  }, [])

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quota`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setQuota(data);
      } catch {
        setQuota(null);
      }
    };
    fetchQuota();
  }, []);

  useEffect(() => {
    const fetchDevis = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quotes`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setDevis(
          data.map((d: any) => ({
            ...d,
            statut: d.statut || "EN_ATTENTE",
          }))
        );
      } catch (err) {
        toast.error("Impossible de charger les devis");
      }
      setLoading(false);
    };
    fetchDevis();
  }, []);

  useEffectToastOnRedirect(handleShowPdf);

  // Sélection groupée
  const toggleSelect = (id: string) => {
    setSelected((sel) =>
      sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]
    );
  };
  const selectAll = () => {
    setSelected(visibleDevis.map((d) => d.id));
  };
  const deselectAll = () => {
    setSelected([]);
  };

  const handleDelete = (id: string) => {
    showConfirmToast("Supprimer ce devis ?", async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quotes/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        setDevis((devis) => devis.filter((d) => d.id !== id));
        setSelected((selected) => selected.filter((x) => x !== id));
        toast.success("Devis supprimé !");
      } catch {
        toast.error("Suppression impossible.");
      }
    });
  };

  const handleDeleteSelected = () => {
    showConfirmToast(`Supprimer ${selected.length} devis ?`, async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quotes/bulk-delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ids: selected }),
        });
        if (!res.ok) throw new Error();
        setDevis((devis) => devis.filter((d) => !selected.includes(d.id)));
        setSelected([]);
        toast.success("Devis supprimés !");
      } catch {
        toast.error("Suppression impossible.");
      }
    });
  };

  // Filtres actifs
  const filteredDevis = devis.filter((devis) => {
    const matchSearch = devis.clientName?.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filtreStatut === 'Tous' || devis.statut === filtreStatut;
    return matchSearch && matchStatut;
  });

  // Affichage 5 derniers si pas de filtre ni recherche
  const visibleDevis =
    search.trim() === '' && filtreStatut === 'Tous'
      ? filteredDevis.slice(0, 5)
      : filteredDevis;

  const montantAccepte = devis
    .filter((d) => d.statut === 'ACCEPTE')
    .reduce((total, d) => total + (d.totalTTC || 0), 0);

  const handleChangeStatut = async (devisItem: Devis, newStatut: QuoteStatus) => {
    if (newStatut === devisItem.statut) {
      setDropdownOpenId(null);
      return;
    }
    setDevis(ds =>
      ds.map(d => d.id === devisItem.id ? { ...d, statut: newStatut } : d)
    );
    setDropdownOpenId(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quotes/${devisItem.id}/statut`, {
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
      setDevis(ds =>
        ds.map(d => d.id === devisItem.id ? { ...d, statut: devisItem.statut } : d)
      );
    }
  };

  const renderQuotaBanner = () => {
    if (!quota) return null;
    if (quota.offer === "FREEMIUM") {
      const remaining = quota.max - quota.used;
      return (
        <div style={{
          marginBottom: 16,
          padding: "12px 18px",
          background: remaining === 0 ? "#fffbe9" : "#e7f7ee",
          border: `1.5px solid ${remaining === 0 ? "#ffb01f" : "#53c59b"}`,
          borderRadius: 10,
          color: remaining === 0 ? "#e59500" : "#158466",
          fontWeight: 500,
          fontSize: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          {remaining > 0 ? (
            <>
              <span>Il vous reste <b>{remaining}/{quota.max}</b> document(s) à générer ce mois-ci sur l’offre <b>FREEMIUM</b>.</span>
            </>
          ) : (
            <>
              <span>
                <b>Quota atteint !</b> Vous avez atteint la limite de <b>{quota.max}</b> documents/mois avec l’offre <b>FREEMIUM</b>.
              </span>
              <a
                href="/dashboard/abonnement"
                style={{
                  marginLeft: 16,
                  padding: "8px 18px",
                  background: "#ffb01f",
                  color: "#fff",
                  borderRadius: 8,
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 2px 12px #ffeab9",
                  border: "none",
                  cursor: "pointer",
                  transition: "background .15s"
                }}
              >
                Passer à une offre supérieure
              </a>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      {/* BANDEAU QUOTA */}
      {renderQuotaBanner()}

      <div className={styles.header}>
        <h1 className={styles.title}>Mes devis</h1>
        <button className={styles.createButton} onClick={() => window.location.href = "/dashboard/devis/nouveau"}>
          Créer un devis
        </button>
      </div>

      <div className={styles.cards}>
        <div className={styles.card}>
          <p className="text-gray-600 mb-1">Devis acceptés</p>
          <p className="text-2xl font-bold">{montantAccepte.toLocaleString('fr-FR')} €</p>
        </div>
        <div className={styles.card}>
          <p className="text-gray-600 mb-1">Nombre de devis générés</p>
          <p className="text-2xl font-bold">{devis.length}</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold">Evolution des devis acceptés</h2>
      <RevenueChart data={devis} type="devis" />

      {/* BARRE FILTRES & SUPPRESSION GROUPÉE */}
      <div className={styles.filtersBar} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        {/* Sélection groupée */}
        {selected.length > 0 && (
          <div style={{
            background: "#fff8e1",
            border: "1px solid #ffe0b2",
            borderRadius: 8,
            padding: "6px 16px",
            color: "#d35400",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginRight: 12
          }}>
            <span>{selected.length} sélectionné(s)</span>
            <button
              style={{
                background: "#e57373",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 700,
                padding: "7px 16px",
                marginLeft: 4,
                cursor: "pointer",
                transition: "background .15s"
              }}
              onClick={handleDeleteSelected}
            >
              Supprimer la sélection
            </button>
          </div>
        )}
        {/* Filtres */}
        <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 12 }}>
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
            style={{ flex: 1 }}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selected.length === visibleDevis.length && visibleDevis.length > 0}
                  onChange={() =>
                    selected.length === visibleDevis.length
                      ? deselectAll()
                      : selectAll()
                  }
                />
              </th>
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
                <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>Chargement…</td>
              </tr>
            ) : visibleDevis.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1rem', color: '#aaa' }}>
                  Aucun devis trouvé.
                </td>
              </tr>
            ) : (
              visibleDevis.map((devisItem) => (
                <tr key={devisItem.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(devisItem.id)}
                      onChange={() => toggleSelect(devisItem.id)}
                    />
                  </td>
                  <td>{devisItem.number}</td>
                  <td>{devisItem.clientName}</td>
                  <td>{devisItem.issuedAt ? new Date(devisItem.issuedAt).toLocaleDateString("fr-FR") : ''}</td>
                  <td>{devisItem.totalTTC?.toLocaleString('fr-FR')} €</td>
                  <td>
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <span
                        className={`${styles.status} ${
                          devisItem.statut === 'ACCEPTE'
                            ? styles.statusPayee
                            : devisItem.statut === 'EN_ATTENTE'
                            ? styles.statusAttente
                            : styles.statusAnnule
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => setDropdownOpenId(dropdownOpenId === devisItem.id ? null : devisItem.id)}
                      >
                        {STATUT_LABELS[devisItem.statut]} ⌄
                      </span>
                      {dropdownOpenId === devisItem.id && (
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
                                fontWeight: s.value === devisItem.statut ? "bold" : "normal",
                                color: s.value === devisItem.statut ? "#4f46e5" : "#222",
                                background: s.value === devisItem.statut ? "#f3f4f6" : "transparent"
                              }}
                              onClick={() => handleChangeStatut(devisItem, s.value)}
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
                      {/* Afficher PDF (icone oeil) */}
                      <button
                        onClick={() => handleShowOrDownloadPdf(devisItem.id, devisItem.number)}
                        title="Afficher le devis PDF"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.2em"
                        }}
                      >
                        👁️
                      </button>
                      {/* Télécharger PDF (décommente si tu veux le bouton download à part) */}
                      {/* <button
                        onClick={() => handleShowOrDownloadPdf(devisItem.id, devisItem.number)}
                        title="Télécharger le devis PDF"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.2em"
                        }}
                      >
                        📄
                      </button> */}
                      <button
                        title="Supprimer"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.2em",
                          color: "#e57373"
                        }}
                        onClick={() => handleDelete(devisItem.id)}
                      >
                        🗑️
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
