"use client";

import { useState, useEffect } from "react";
import { SettingsPanel, Settings } from "@/components/SettingsPanel";
import InvoiceForm, { Issuer } from "@/components/InvoiceForm";
import styles from "./page.module.css";

export default function NewInvoicePage() {
  const [settings, setSettings] = useState<Settings>({
    enableVAT: false,
    vatPerLine: false,
    vatRate: 20,
    showQuantity: true,
    showUnit: false,
  });

  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [selectedIssuerId, setSelectedIssuerId] = useState<string>("");

  const [issuerData, setIssuerData] = useState<Issuer | null>(null);

  useEffect(() => {
    async function fetchIssuers() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/issuer`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) return;

        const data: Issuer = await res.json();
        // on ajoute l'ID pour le select (ici on réutilise le SIRET)
        setIssuers([{ ...data, id: data.siret }]);
        setSelectedIssuerId(data.siret);
      } catch (err) {
        console.error("fetchIssuers error →", err);
      }
    }
    fetchIssuers();
  }, []);

  const loadIssuer = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/issuer`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Issuer = await res.json();
      setIssuerData(data);
    } catch (err) {
      console.error("loadIssuer error →", err);
      alert("Impossible de charger l’émetteur");
    }
  };

  return (
    <div className={styles.dashboardLayout}>
      <SettingsPanel
        settings={settings}
        onChange={setSettings}
        issuers={issuers}
        selectedIssuerId={selectedIssuerId}
        onSelectIssuer={setSelectedIssuerId}
        onLoadIssuer={loadIssuer}
      />

      <div className={styles.invoiceWrapper}>
        <InvoiceForm settings={settings} initialIssuer={issuerData} />
      </div>
    </div>
  );
}
