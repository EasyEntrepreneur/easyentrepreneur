'use client'

import { useState, useEffect } from 'react'
import styles from './factures.module.css'
import toast from "react-hot-toast"
import RevenueChart from '@/components/RevenueChart';

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
  statut: InvoiceStatus
}

// QUOTA TYPES
type QuotaInfo = {
  used: number
  max: number
  offer: string
};

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
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${number}/pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Erreur lors du téléchargement du PDF");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => window.URL.revokeObjectURL(url), 5000);
  } catch (e) {
    toast.error("Impossible d'ouvrir le PDF");
  }
};

export function showConfirmToast(message: string, onConfirm: () => void) {
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

  // QUOTA STATES
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  // Sélection
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    // Récupère quota dès l'arrivée sur la page
    const fetchQuota = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quota`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
            statut: f.statut || "EN_ATTENTE",
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

  // Sélection groupée
  const toggleSelect = (id: string) => {
    setSelected((sel) =>
      sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]
    );
  };
  const selectAll = () => {
    setSelected(visibleFactures.map((f) => f.id));
  };
  const deselectAll = () => {
    setSelected([]);
  };
  
  const handleDelete = (id: string) => {
    showConfirmToast("Supprimer cette facture ?", async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error();
        setFactures((factures) => factures.filter((f) => f.id !== id));
        setSelected((selected) => selected.filter((x) => x !== id));
        toast.success("Facture supprimée !");
      } catch {
        toast.error("Suppression impossible.");
      }
    });
  };

  const handleDeleteSelected = () => {
    showConfirmToast(`Supprimer ${selected.length} facture(s) ?`, async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/bulk-delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ids: selected }),
        });
        if (!res.ok) throw new Error();
        setFactures((factures) => factures.filter((f) => !selected.includes(f.id)));
        setSelected([]);
        toast.success("Factures supprimées !");
      } catch {
        toast.error("Suppression impossible.");
      }
    });
  };


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

  const handleChangeStatut = async (facture: Facture, newStatut: InvoiceStatus) => {
    if (newStatut === facture.statut) {
      setDropdownOpenId(null);
      return;
    }
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
      setFactures(fs =>
        fs.map(f => f.id === facture.id ? { ...f, statut: facture.statut } : f)
      );
    }
  };

  // BANDEAU QUOTA et PROMO (front minimal)
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

      {/* NOUVELLE BARRE FILTRES & SUPPRESSION GROUPÉE */}
      <div className={styles.filtersBar} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        {/* Boutons et texte à gauche */}
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
            <span>{selected.length} sélectionnée(s)</span>
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
        {/* Filtres classiques à droite */}
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
                  checked={selected.length === visibleFactures.length && visibleFactures.length > 0}
                  onChange={() =>
                    selected.length === visibleFactures.length
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
            ) : visibleFactures.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1rem', color: '#aaa' }}>
                  Aucune facture trouvée.
                </td>
              </tr>
            ) : (
              visibleFactures.map((facture) => (
                <tr key={facture.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(facture.id)}
                      onChange={() => toggleSelect(facture.id)}
                    />
                  </td>
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
                      <button
                        title="Supprimer"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "1.2em",
                          color: "#e57373"
                        }}
                        onClick={() => handleDelete(facture.id)}
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
