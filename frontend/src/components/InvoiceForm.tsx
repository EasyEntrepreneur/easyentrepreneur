"use client";

import { useState, useEffect } from "react";
import styles from "./InvoiceForm.module.css";
import { Settings } from "@/components/SettingsPanel";

export type Issuer = {
  id?: string;
  name: string;
  address: string;
  zip: string;
  city: string;
  siret: string;
  vat?: string;
  phone?: string;
};

// Ajout du type Client
type Client = {
  name: string;
  address: string;
  zip: string;
  city: string;
  siret?: string;
  vat?: string;
  phone?: string;
  // Ajoute ici country/email si tu les ajoutes plus tard !
};

type Item = {
  description: string;
  quantity: number;
  unitPrice: number;
};

interface InvoiceFormProps {
  settings: Settings;
  initialIssuer?: Issuer | null;
}

export default function InvoiceForm({
  settings,
  initialIssuer = null,
}: InvoiceFormProps) {
  // ── ÉMETTEUR ─────────────────────────────────────────────────────────────
  const [issuer, setIssuer] = useState({
    name: "",
    address: "",
    zip: "",
    city: "",
    siret: "",
  });
  const [showIssuerTva, setShowIssuerTva] = useState(true);
  const [issuerTva, setIssuerTva] = useState("");
  const [showIssuerPhone, setShowIssuerPhone] = useState(true);
  const [issuerPhone, setIssuerPhone] = useState("");
  const [issuerExtra, setIssuerExtra] = useState<string[]>([]);

  // ── CLIENT ───────────────────────────────────────────────────────────────
  const [client, setClient] = useState<Client>({
    name: "",
    address: "",
    zip: "",
    city: "",
    siret: "",
    vat: "",
    phone: "",
  });
  const [showClientPhone, setShowClientPhone] = useState(true);
  const [clientPhone, setClientPhone] = useState("");
  const [clientExtra, setClientExtra] = useState<string[]>([]);

  // ── DATE ─────────────────────────────────────────────────────────────────
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));

  // ── LIGNES DE FACTURE ────────────────────────────────────────────────────
  const [items, setItems] = useState<Item[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  // ── TVA PAR LIGNE ────────────────────────────────────────────────────────
  const [lineVats, setLineVats] = useState<number[]>(
    items.map(() => settings.vatRate)
  );
  useEffect(() => {
    setLineVats((old) => {
      const copy = [...old];
      if (copy.length < items.length) {
        // ajout de ligne
        return [...copy, settings.vatRate];
      } else if (copy.length > items.length) {
        // suppression de ligne
        return copy.slice(0, items.length);
      }
      return copy;
    });
  }, [items.length, settings.vatRate]);

  const handleLineVatChange = (index: number, value: string) => {
    const val = parseFloat(value) || 0;
    setLineVats((old) => {
      const copy = [...old];
      copy[index] = val;
      return copy;
    });
  };

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const [paymentInfo, setPaymentInfo] = useState("");
  const [legalNote, setLegalNote] = useState(
    "TVA non applicable, art. 293B du CGI"
  );

  // ── CALCULS ───────────────────────────────────────────────────────────────
  const totalHT = items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0
  );
  // calcul global ou par ligne selon settings
  const totalVAT = settings.enableVAT
    ? settings.vatPerLine
      ? items.reduce(
          (sum, it, idx) =>
            sum + it.quantity * it.unitPrice * (lineVats[idx] / 100),
          0
        )
      : totalHT * (settings.vatRate / 100)
    : 0;
  const totalTTC = totalHT + totalVAT;

  // ── PRÉ-REMPLISSAGE ÉMETTEUR ─────────────────────────────────────────────
  useEffect(() => {
    if (initialIssuer) {
      setIssuer({
        name: initialIssuer.name,
        address: initialIssuer.address,
        zip: initialIssuer.zip,
        city: initialIssuer.city,
        siret: initialIssuer.siret,
      });
      setIssuerTva(initialIssuer.vat || "");
      setIssuerPhone(initialIssuer.phone || "");
    }
  }, [initialIssuer]);

  // ── HANDLERS LIGNES ──────────────────────────────────────────────────────
  const handleItemChange = (
    index: number,
    field: keyof Item,
    value: string
  ) => {
    const updated = [...items];
    if (field === "quantity" || field === "unitPrice") {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      (updated[index] as any)[field] = value;
    }
    setItems(updated);
  };
  const addItem = () =>
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) =>
    setItems(items.filter((_, idx) => idx !== i));

  // ── HANDLERS CHAMPS LIBRES ÉMETTEUR ─────────────────────────────────────
  const addIssuerField = () => setIssuerExtra([...issuerExtra, ""]);
  const updateIssuerField = (i: number, val: string) => {
    const u = [...issuerExtra];
    u[i] = val;
    setIssuerExtra(u);
  };
  const removeIssuerField = (i: number) =>
    setIssuerExtra(issuerExtra.filter((_, idx) => idx !== i));

  // ── HANDLERS CHAMPS LIBRES CLIENT ───────────────────────────────────────
  const addClientField = () => setClientExtra([...clientExtra, ""]);
  const updateClientField = (i: number, val: string) => {
    const u = [...clientExtra];
    u[i] = val;
    setClientExtra(u);
  };
  const removeClientField = (i: number) =>
    setClientExtra(clientExtra.filter((_, idx) => idx !== i));

  // --- SOUMISSION DU FORMULAIRE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Préparation du payload avec le client ---
    const clientPayload = {
      name: client.name,
      address: client.address,
      zip: client.zip,
      city: client.city,
      siret: client.siret,
      vat: client.vat,
      phone: clientPhone,
    };

    // Items enrichis avec TVA par ligne si besoin
    const itemsPayload = items.map((item, i) => ({
      ...item,
      vatRate: settings.enableVAT
        ? settings.vatPerLine
          ? lineVats[i]
          : settings.vatRate
        : 0,
    }));

    const payload = {
      client: clientPayload,
      items: itemsPayload,
      paymentInfo,
      // Ajoute ici les autres champs à envoyer si nécessaire
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Non authentifié");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erreur lors de la création de la facture");
      alert("Facture enregistrée !");
      // Optionnel: reset le formulaire ici si tu veux
    } catch (err) {
      console.error("Erreur création facture :", err);
      alert("Erreur lors de la création de la facture !");
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <input
            className={styles.titleInput}
            value="Facture N°1"
            readOnly
          />
        </h1>

        {/* ═══ ÉMETTEUR ═════════════════════════════════════════════════════ */}
        <div className={styles.issuer}>
          <input
            className={styles.inputAuto}
            placeholder="Nom complet"
            value={issuer.name}
            onChange={(e) =>
              setIssuer((p) => ({ ...p, name: e.target.value }))
            }
          />
          <input
            className={styles.inputAuto}
            placeholder="Adresse"
            value={issuer.address}
            onChange={(e) =>
              setIssuer((p) => ({ ...p, address: e.target.value }))
            }
          />
          <div className={styles.flexLine}>
            <input
              className={styles.inputAuto}
              placeholder="Code postal"
              value={issuer.zip}
              onChange={(e) =>
                setIssuer((p) => ({ ...p, zip: e.target.value }))
              }
            />
            <input
              className={styles.inputAuto}
              placeholder="Ville"
              value={issuer.city}
              onChange={(e) =>
                setIssuer((p) => ({ ...p, city: e.target.value }))
              }
            />
          </div>
          <input
            className={styles.inputAuto}
            placeholder="SIRET"
            value={issuer.siret}
            onChange={(e) =>
              setIssuer((p) => ({ ...p, siret: e.target.value }))
            }
          />

          {/* TVA émetteur */}
          {showIssuerTva && (
            <div className={styles.fieldRowRight}>
              <input
                className={styles.inputAuto}
                placeholder="N° TVA"
                value={issuerTva}
                onChange={(e) => setIssuerTva(e.target.value)}
              />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => setShowIssuerTva(false)}
              >
                −
              </button>
            </div>
          )}

          {/* Téléphone émetteur */}
          {showIssuerPhone && (
            <div className={styles.fieldRowRight}>
              <input
                className={styles.inputAuto}
                placeholder="Tél"
                value={issuerPhone}
                onChange={(e) => setIssuerPhone(e.target.value)}
              />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => setShowIssuerPhone(false)}
              >
                −
              </button>
            </div>
          )}

          {/* Champs libres Émetteur */}
          {issuerExtra.map((val, i) => (
            <div key={i} className={styles.fieldRowRight}>
              <input
                className={styles.inputAuto}
                placeholder="Champ"
                value={val}
                onChange={(e) => updateIssuerField(i, e.target.value)}
              />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeIssuerField(i)}
              >
                −
              </button>
            </div>
          ))}

          {/* + champ Émetteur */}
          <button
            type="button"
            className={styles.addSectionBtn}
            onClick={addIssuerField}
          >
            ＋
          </button>
        </div>

        {/* ═══ CLIENT ═══════════════════════════════════════════════════════ */}
        <div className={styles.client}>
          <input
            className={styles.inputAuto}
            placeholder="Nom complet"
            value={client.name}
            onChange={(e) =>
              setClient((p) => ({ ...p, name: e.target.value }))
            }
          />
          <input
            className={styles.inputAuto}
            placeholder="Adresse"
            value={client.address}
            onChange={(e) =>
              setClient((p) => ({ ...p, address: e.target.value }))
            }
          />
          <div className={styles.flexLine}>
            <input
              className={styles.inputAuto}
              placeholder="Code postal"
              value={client.zip}
              onChange={(e) =>
                setClient((p) => ({ ...p, zip: e.target.value }))
              }
            />
            <input
              className={styles.inputAuto}
              placeholder="Ville"
              value={client.city}
              onChange={(e) =>
                setClient((p) => ({ ...p, city: e.target.value }))
              }
            />
          </div>
          <input
            className={styles.inputAuto}
            placeholder="SIRET"
            value={client.siret}
            onChange={(e) =>
              setClient((p) => ({ ...p, siret: e.target.value }))
            }
          />

          {/* Téléphone client */}
          {showClientPhone && (
            <div className={styles.fieldRowLeft}>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => setShowClientPhone(false)}
              >
                −
              </button>
              <input
                className={styles.inputAuto}
                placeholder="Tél"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
              />
            </div>
          )}

          {/* Champs libres Client */}
          {clientExtra.map((val, i) => (
            <div key={i} className={styles.fieldRowLeft}>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeClientField(i)}
              >
                −
              </button>
              <input
                className={styles.inputAuto}
                placeholder="Champ"
                value={val}
                onChange={(e) => updateClientField(i, e.target.value)}
              />
            </div>
          ))}

          {/* + champ Client */}
          <button
            type="button"
            className={styles.addSectionBtn}
            onClick={addClientField}
          >
            ＋
          </button>
        </div>
      </div>

      {/* ── DATE ───────────────────────────────────────────────────────────── */}
      <table className={styles.dateTable}>
        <tbody>
          <tr>
            <td className={styles.dateLabel}>Date de facture</td>
            <td className={styles.dateInput}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── LIGNES ───────────────────────────────────────────────────────────── */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantité</th>
            <th>Prix unitaire HT</th>
            <th>Prix total HT</th>
            {settings.enableVAT && settings.vatPerLine && (
              <>
                <th>TVA&nbsp;(%)</th>
                <th>Total TTC</th>
              </>
            )}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>
                <input
                  placeholder="Prestation"
                  value={it.description}
                  onChange={(e) =>
                    handleItemChange(i, "description", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={it.quantity}
                  onChange={(e) =>
                    handleItemChange(i, "quantity", e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="number"
                  value={it.unitPrice}
                  onChange={(e) =>
                    handleItemChange(i, "unitPrice", e.target.value)
                  }
                />
              </td>
              <td>{(it.quantity * it.unitPrice).toFixed(2)} €</td>
              {settings.enableVAT && settings.vatPerLine && (
                <>
                  <td>
                    <input
                      type="number"
                      className={styles.smallInput}
                      value={lineVats[i]}
                      onChange={(e) =>
                        handleLineVatChange(i, e.target.value)
                      }
                    />
                  </td>
                  <td>
                    {(it.quantity *
                      it.unitPrice *
                      (1 + lineVats[i] / 100)
                    ).toFixed(2)}{" "}
                    €
                  </td>
                </>
              )}
              <td>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeItem(i)}
                >
                  −
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.addBtnContainer}>
        <button
          type="button"
          className={styles.addLine}
          onClick={addItem}
        >
          ＋
        </button>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <div className={styles.footerRow}>
        <textarea
          className={styles.payment}
          placeholder="Informations complémentaires (IBAN, BIC...)"
          value={paymentInfo}
          onChange={(e) => setPaymentInfo(e.target.value)}
        />
        <div className={styles.summary}>
          <div>
            <span>Total HT</span>
            <span>{totalHT.toFixed(2)} €</span>
          </div>
          {settings.enableVAT && settings.vatPerLine ? (
            <div>
              <span>TVA</span>
              <span>{totalVAT.toFixed(2)} €</span>
            </div>
          ) : settings.enableVAT ? (
            <div>
              <span>TVA&nbsp;({settings.vatRate}&nbsp;%)</span>
              <span>{totalVAT.toFixed(2)} €</span>
            </div>
          ) : null}
          <div className={styles.totalTTC}>
            <strong>Total TTC</strong>
            <strong>{totalTTC.toFixed(2)} €</strong>
          </div>
        </div>
      </div>

      <textarea
        className={styles.legal}
        value={legalNote}
        onChange={(e) => setLegalNote(e.target.value)}
      />

      <button type="submit" className={styles.submit}>
        Enregistrer
      </button>
    </form>
  );
}
