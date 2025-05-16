"use client";
import { useState } from "react";
import styles from "./InvoiceForm.module.css";

export default function InvoiceForm() {
  const [invoiceTitle, setInvoiceTitle] = useState("Facture N°1");

  // Émetteur
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

  // Champs libres supplémentaires émetteur
  const [issuerExtra, setIssuerExtra] = useState<string[]>([]);

  // Client
  const [client, setClient] = useState({
    name: "",
    address: "",
    zip: "",
    city: "",
    siret: "",
  });
  const [showClientPhone, setShowClientPhone] = useState(true);
  const [clientPhone, setClientPhone] = useState("");

  // Champs libres supplémentaires client
  const [clientExtra, setClientExtra] = useState<string[]>([]);

  // Date & lignes
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [paymentInfo, setPaymentInfo] = useState("");
  const [legalNote, setLegalNote] = useState("TVA non applicable, art. 293B du CGI");

  // Handlers
  const handleItemChange = (i: number, field: string, val: string) => {
    const upd = [...items];
    upd[i][field] = field === "quantity" || field === "unitPrice" ? parseFloat(val) : val;
    setItems(upd);
  };
  const addItem = () => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  const totalHT = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  // Extra fields handlers
  const addIssuerField = () => setIssuerExtra([...issuerExtra, ""]);
  const updateIssuerField = (i: number, val: string) => {
    const upd = [...issuerExtra]; upd[i] = val; setIssuerExtra(upd);
  };
  const removeIssuerField = (i: number) =>
    setIssuerExtra(issuerExtra.filter((_, idx) => idx !== i));

  const addClientField = () => setClientExtra([...clientExtra, ""]);
  const updateClientField = (i: number, val: string) => {
    const upd = [...clientExtra]; upd[i] = val; setClientExtra(upd);
  };
  const removeClientField = (i: number) =>
    setClientExtra(clientExtra.filter((_, idx) => idx !== i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: envoi au back
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* HEADER */}
      <div className={styles.header}>
        {/* Titre à droite */}
        <h1 className={styles.title}>
          <input
            className={styles.titleInput}
            value={invoiceTitle}
            onChange={e => setInvoiceTitle(e.target.value)}
          />
        </h1>

        {/* ÉMETTEUR */}
        <div className={styles.issuer}>
          <input
            className={styles.inputAuto}
            placeholder="Nom complet"
            value={issuer.name}
            onChange={e => setIssuer({ ...issuer, name: e.target.value })}
          />
          <input
            className={styles.inputAuto}
            placeholder="Adresse"
            value={issuer.address}
            onChange={e => setIssuer({ ...issuer, address: e.target.value })}
          />
          <div className={styles.flexLine}>
            <input
              className={styles.inputAuto}
              placeholder="Code postal"
              value={issuer.zip}
              onChange={e => setIssuer({ ...issuer, zip: e.target.value })}
            />
            <input
              className={styles.inputAuto}
              placeholder="Ville"
              value={issuer.city}
              onChange={e => setIssuer({ ...issuer, city: e.target.value })}
            />
          </div>
          <input
            className={styles.inputAuto}
            placeholder="SIRET"
            value={issuer.siret}
            onChange={e => setIssuer({ ...issuer, siret: e.target.value })}
          />

          {showIssuerTva && (
            <div className={styles.fieldRowRight}>
              <input
                className={styles.inputAuto}
                placeholder="N° TVA"
                value={issuerTva}
                onChange={e => setIssuerTva(e.target.value)}
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

          {showIssuerPhone && (
            <div className={styles.fieldRowRight}>
              <input
                className={styles.inputAuto}
                placeholder="Tél"
                value={issuerPhone}
                onChange={e => setIssuerPhone(e.target.value)}
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

          {/* Champs libres émetteur */}
          {issuerExtra.map((val, i) => (
            <div key={i} className={styles.fieldRowRight}>
              <input
                className={styles.inputAuto}
                placeholder="Champ"
                value={val}
                onChange={e => updateIssuerField(i, e.target.value)}
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

          {/* bouton + sous émetteur */}
          <button
            type="button"
            className={styles.addSectionBtn}
            onClick={addIssuerField}
          >
            ＋
          </button>
        </div>

        {/* CLIENT */}
        <div className={styles.client}>
          <input
            className={styles.inputAuto}
            placeholder="Nom complet"
            value={client.name}
            onChange={e => setClient({ ...client, name: e.target.value })}
          />
          <input
            className={styles.inputAuto}
            placeholder="Adresse"
            value={client.address}
            onChange={e => setClient({ ...client, address: e.target.value })}
          />
          <div className={styles.flexLine}>
            <input
              className={styles.inputAuto}
              placeholder="Code postal"
              value={client.zip}
              onChange={e => setClient({ ...client, zip: e.target.value })}
            />
            <input
              className={styles.inputAuto}
              placeholder="Ville"
              value={client.city}
              onChange={e => setClient({ ...client, city: e.target.value })}
            />
          </div>
          <input
            className={styles.inputAuto}
            placeholder="SIRET"
            value={client.siret}
            onChange={e => setClient({ ...client, siret: e.target.value })}
          />

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
                onChange={e => setClientPhone(e.target.value)}
              />
            </div>
          )}

          {/* Champs libres client */}
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
                onChange={e => updateClientField(i, e.target.value)}
              />
            </div>
          ))}

          {/* bouton + sous client */}
          <button
            type="button"
            className={styles.addSectionBtn}
            onClick={addClientField}
          >
            ＋
          </button>
        </div>
      </div>

      {/* DATE */}
      <table className={styles.dateTable}>
        <tbody>
          <tr>
            <td className={styles.dateLabel}>Date de facture</td>
            <td className={styles.dateInput}>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
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
                  onChange={e => handleItemChange(i, "description", e.target.value)}
                  placeholder="Prestation"
                />
              </td>
              <td>
                <input
                  type="number"
                  value={it.quantity}
                  onChange={e => handleItemChange(i, "quantity", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={it.unitPrice}
                  onChange={e => handleItemChange(i, "unitPrice", e.target.value)}
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

      {/* + sous le tableau */}
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
        onChange={e => setPaymentInfo(e.target.value)}
        placeholder="Informations complémentaires (IBAN, BIC...)"
        />
        <div className={styles.summary}>
          <div>
            <span>Total HT</span><span>{totalHT.toFixed(2)} €</span>
          </div>
          <div>
            <span>TVA (20 %)</span><span>{(totalHT * 0.2).toFixed(2)} €</span>
          </div>
          <div className={styles.totalTTC}>
            <strong>Total TTC</strong><strong>{(totalHT * 1.2).toFixed(2)} €</strong>
          </div>
        </div>
      </div>

      <textarea
        className={styles.legal}
        value={legalNote}
        onChange={e => setLegalNote(e.target.value)}
      />

      <button type="submit" className={styles.submit}>Enregistrer</button>
    </form>
  );
}
