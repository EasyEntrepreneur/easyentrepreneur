import React from "react";
import { Settings } from "@/components/SettingsPanel";

// Types
type Issuer = {
  name: string;
  address: string;
  zip: string;
  city: string;
  siret: string;
  vat?: string;
  phone?: string;
  extra?: string[];
};

type Client = {
  name: string;
  address: string;
  zip: string;
  city: string;
  siret?: string;
  vat?: string;
  phone?: string;
  extra?: string[];
};

type Item = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
};

interface QuotePreviewProps {
  issuer: Issuer;
  client: Client;
  items: Item[];
  date: string;
  QuoteTitle: string; // Ajout ici
  settings: Settings;
  paymentInfo: string;
  legalNote: string;
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
}

const formatDate = (str: string) => {
  if (!str) return "";
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
};

export default function QuotePreview({
  issuer,
  client,
  items,
  date,
  QuoteTitle,
  settings,
  paymentInfo,
  legalNote,
  totalHT,
  totalVAT,
  totalTTC,
}: QuotePreviewProps) {
  return (
    <div className="form" style={{ boxShadow: "none", margin: 0 }}>
      <style>
        {`
.form {
  max-width: 960px;
  margin: 0 auto;
  padding: 2rem;
  background: #fff;
  border-radius: 16px;
  font-family: "Segoe UI", Roboto, sans-serif;
  font-size: 1.04rem;
}
.header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto auto;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.title {
  grid-column: 1 / -1;
  margin: 0;
  text-align: right;
}
.titleInput {
  font-size: 1.35rem;
  font-weight: bold;
  border: none;
  background: transparent;
  width: 100%;
  text-align: right;
}
.issuer {
  grid-column: 1;
  grid-row: 2;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  font-size: 1.13rem;
  font-weight: 500;
}
.issuer > div:first-child { font-size: 1.25rem; font-weight: 700; }
.client {
  grid-column: 2;
  grid-row: 3;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  text-align: right;
  font-size: 1.13rem;
  font-weight: 500;
}
.client > div:first-child { font-size: 1.19rem; font-weight: 700; }
.dateTable {
  width: 50%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
  margin-left: 0;
}
.dateTable td {
  border: 1px solid #ddd;
  vertical-align: middle;
  text-align: center;
  font-size: 1rem;
  padding: 0.6rem;
}
.dateLabel {
  padding: 0.75rem;
  font-weight: 600;
  text-align: center;
}
.dateInput {
  text-align: center;
}
.table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0.5rem;
  font-size: 1.01rem;
}
.table th {
  border: 1px solid #ddd;
  padding: 0.75rem;
  font-weight: 600;
  text-align: center;
}
.table td {
  padding: 0.55rem;
  border: 1px solid #ddd;
  vertical-align: middle;
  font-size: 1.02rem;
}
.table td:not(:first-child) {
  text-align: center;
}
.table td:first-child {
  text-align: left;
}
.footerRow {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2rem;
  margin-top: 2rem;
  align-items: flex-start;
}
.payment {
  min-width: 210px;
  max-width: 600px;
  min-height: 80px;
  padding: 0.5rem 0.9rem;
  border-radius: 6px;
  border: none;
  outline: none;
  box-shadow: none;
  resize: none;
  background: none;
  color: #222;
  white-space: pre-line;
  margin-top: 0.16rem;
  word-break: break-word;
}
.summary > div {
  display: flex;
  justify-content: space-between;
  padding: 0.44rem 0;
  border-bottom: 1px solid #eee;
}
.totalTTC {
  width: 240px;
  font-weight: bold;
  border-top: 2px solid #ddd;
  padding-top: 0.66rem;
  font-size: 1.05rem;
}
.legal {
  border: none;
  outline: none;
  box-shadow: none;
  width: 100%;
  text-align: center;
  margin: 2rem auto 0;
  display: block;
  resize: none;
  color: #666;
  font-size: 1rem;
  word-break: break-word;
  white-space: pre-line;
}
  
        `}
      </style>

      {/* ---- HEADER ---- */}
      <div className="header">
        <div className="issuer">
          <div>{issuer.name}</div>
          <div>{issuer.address}</div>
          <div>
            {issuer.zip} {issuer.city}
          </div>
          <div>SIRET : {issuer.siret}</div>
          {issuer.vat && <div>TVA : {issuer.vat}</div>}
          {issuer.phone && <div>Tél : {issuer.phone}</div>}
          {issuer.extra && issuer.extra.map((ex, i) => (
            <div key={i}>{ex}</div>
          ))}
        </div>
        <div className="client">
          <div>{client.name}</div>
          <div>{client.address}</div>
          <div>
            {client.zip} {client.city}
          </div>
          {client.siret && <div>SIRET : {client.siret}</div>}
          {client.vat && <div>TVA : {client.vat}</div>}
          {client.phone && <div>Tél : {client.phone}</div>}
          {client.extra && client.extra.map((ex, i) => (
            <div key={i}>{ex}</div>
          ))}
        </div>
        <div className="title">
          <span className="titleInput">{QuoteTitle}</span>
        </div>
      </div>

      {/* ---- DATE ---- */}
      <table className="dateTable">
        <tbody>
          <tr>
            <td className="dateLabel">Date de facture</td>
            <td className="dateInput">{formatDate(date)}</td>
          </tr>
        </tbody>
      </table>

      {/* ---- TABLEAU ---- */}
      <table className="table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantité</th>
            <th>Prix unitaire HT</th>
            <th>Prix total HT</th>
            {settings.enableVAT && settings.vatPerLine && (
              <>
                <th>TVA (%)</th>
                <th>Total TTC</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td>{it.description}</td>
              <td>{it.quantity}</td>
              <td>{it.unitPrice.toFixed(2)} €</td>
              <td>{(it.unitPrice * it.quantity).toFixed(2)} €</td>
              {settings.enableVAT && settings.vatPerLine && (
                <>
                  <td>{it.vatRate?.toFixed(2) ?? 0}</td>
                  <td>
                    {(it.unitPrice * it.quantity * (1 + (it.vatRate ?? 0) / 100)).toFixed(2)} €
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ---- FOOTER ---- */}
      <div className="footerRow">
        <div className="payment">{paymentInfo}</div>
        <div className="summary">
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
          <div className="totalTTC">
            <strong>Total TTC</strong>
            <strong>{totalTTC.toFixed(2)} €</strong>
          </div>
        </div>
      </div>

      {/* ---- NOTE LÉGALE ---- */}
      <div className="legal">{legalNote}</div>
    </div>
  );
}
