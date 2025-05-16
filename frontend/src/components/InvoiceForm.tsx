// frontend/src/components/InvoiceForm.tsx
"use client";

import { useState, useEffect } from "react";
import styles from "./InvoiceForm.module.css";
import { Settings } from "@/components/SettingsPanel";

export type Issuer = {
  name: string;
  address: string;
  zip: string;
  city: string;
  siret: string;
  vat?: string;
  phone?: string;
};

type Item = {
  description: string;
  quantity: number;
  unitPrice: number;
};

interface InvoiceFormProps {
  settings: Settings;
  /** données chargées depuis le backend */
  initialIssuer?: Issuer | null;
}

export default function InvoiceForm({
  settings,
  initialIssuer = null,
}: InvoiceFormProps) {
  // États de l’émetteur
  const [issuer, setIssuer] = useState({
    name: "",
    address: "",
    zip: "",
    city: "",
    siret: "",
  });
  const [issuerTva, setIssuerTva] = useState("");
  const [issuerPhone, setIssuerPhone] = useState("");

  // États du client (modelez-les de la même façon si vous voulez le pré-remplir aussi !)
  const [client, setClient] = useState({
    name: "",
    address: "",
    zip: "",
    city: "",
    siret: "",
  });
  const [clientPhone, setClientPhone] = useState("");

  // Date et lignes de facture
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [items, setItems] = useState<Item[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  // Footer
  const [paymentInfo, setPaymentInfo] = useState("");
  const [legalNote, setLegalNote] = useState(
    "TVA non applicable, art. 293B du CGI"
  );

  // Total hors taxe
  const totalHT = items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0
  );

  // Dès que initialIssuer change (après le click Charger), on pré-remplit l’émetteur :
  useEffect(() => {
    console.log("📥 InvoiceForm useEffect initialIssuer:", initialIssuer);
    if (initialIssuer) {
      setIssuer({
        name: initialIssuer.name || "",
        address: initialIssuer.address || "",
        zip: initialIssuer.zip || "",
        city: initialIssuer.city || "",
        siret: initialIssuer.siret || "",
      });
      setIssuerTva(initialIssuer.vat || "");
      setIssuerPhone(initialIssuer.phone || "");
    }
  }, [initialIssuer]);

  // Handlers pour les lignes
  const handleItemChange = (
    index: number,
    field: keyof Item,
    value: string
  ) => {
    const updated = [...items];
    if (field === "quantity" || field === "unitPrice") {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setItems(updated);
  };
  const addItem = () =>
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) =>
    setItems(items.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: envoyer la facture au backend
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* HEADER */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <input
            className={styles.titleInput}
            value="Facture N°1"
            readOnly
          />
        </h1>

        {/* ÉMETTEUR */}
        <div className={styles.issuer}>
          <input
            className={styles.inputAuto}
            placeholder="Nom complet"
            value={issuer.name}
            onChange={(e) =>
              setIssuer((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <input
            className={styles.inputAuto}
            placeholder="Adresse"
            value={issuer.address}
            onChange={(e) =>
              setIssuer((prev) => ({ ...prev, address: e.target.value }))
            }
          />
          <div className={styles.flexLine}>
            <input
              className={styles.inputAuto}
              placeholder="Code postal"
              value={issuer.zip}
              onChange={(e) =>
                setIssuer((prev) => ({ ...prev, zip: e.target.value }))
              }
            />
            <input
              className={styles.inputAuto}
              placeholder="Ville"
              value={issuer.city}
              onChange={(e) =>
                setIssuer((prev) => ({ ...prev, city: e.target.value }))
              }
            />
          </div>
          <input
            className={styles.inputAuto}
            placeholder="SIRET"
            value={issuer.siret}
            onChange={(e) =>
              setIssuer((prev) => ({ ...prev, siret: e.target.value }))
            }
          />
          <div className={styles.fieldRowRight}>
            <input
              className={styles.inputAuto}
              placeholder="N° TVA"
              value={issuerTva}
              onChange={(e) => setIssuerTva(e.target.value)}
            />
          </div>
          <div className={styles.fieldRowRight}>
            <input
              className={styles.inputAuto}
              placeholder="Tél"
              value={issuerPhone}
              onChange={(e) => setIssuerPhone(e.target.value)}
            />
          </div>
        </div>

        {/* CLIENT */}
        <div className={styles.client}>
          <input
            className={styles.inputAuto}
            placeholder="Nom complet"
            value={client.name}
            onChange={(e) =>
              setClient((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <input
            className={styles.inputAuto}
            placeholder="Adresse"
            value={client.address}
            onChange={(e) =>
              setClient((prev) => ({ ...prev, address: e.target.value }))
            }
          />
          <div className={styles.flexLine}>
            <input
              className={styles.inputAuto}
              placeholder="Code postal"
              value={client.zip}
              onChange={(e) =>
                setClient((prev) => ({ ...prev, zip: e.target.value }))
              }
            />
            <input
              className={styles.inputAuto}
              placeholder="Ville"
              value={client.city}
              onChange={(e) =>
                setClient((prev) => ({ ...prev, city: e.target.value }))
              }
            />
          </div>
          <input
            className={styles.inputAuto}
            placeholder="SIRET"
            value={client.siret}
            onChange={(e) =>
              setClient((prev) => ({ ...prev, siret: e.target.value }))
            }
          />
          <div className={styles.fieldRowLeft}>
            <input
              className={styles.inputAuto}
              placeholder="Tél"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* DATE */}
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

      {/* LIGNES */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantité</th>
            <th>Prix unitaire HT</th>
            <th>Prix total HT</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>
                <input
                  value={it.description}
                  onChange={(e) =>
                    handleItemChange(i, "description", e.target.value)
                  }
                  placeholder="Prestation"
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
              <td>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className={styles.removeBtn}
                >
                  −
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.addBtnContainer}>
        <button type="button" onClick={addItem} className={styles.addLine}>
          ＋
        </button>
      </div>

      {/* FOOTER */}
      <div className={styles.footerRow}>
        <textarea
          className={styles.payment}
          value={paymentInfo}
          onChange={(e) => setPaymentInfo(e.target.value)}
          placeholder="Informations complémentaires (IBAN, BIC...)"
        />
        <div className={styles.summary}>
          <div>
            <span>Total HT</span>
            <span>{totalHT.toFixed(2)} €</span>
          </div>
          {settings.enableVAT && (
            <div>
              <span>TVA (20 %)</span>
              <span>{(totalHT * 0.2).toFixed(2)} €</span>
            </div>
          )}
          <div className={styles.totalTTC}>
            <strong>Total TTC</strong>
            <strong>
              {settings.enableVAT
                ? (totalHT * 1.2).toFixed(2)
                : totalHT.toFixed(2)}{" "}
              €
            </strong>
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
