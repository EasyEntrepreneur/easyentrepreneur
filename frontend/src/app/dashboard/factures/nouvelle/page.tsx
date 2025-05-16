// frontend/src/app/dashboard/factures/nouvelle/page.tsx
"use client";

import { useState } from "react";
import { SettingsPanel, Settings } from "@/components/SettingsPanel";
import InvoiceForm, { Issuer } from "@/components/InvoiceForm";
import styles from "./page.module.css";

export default function NewInvoicePage() {
  // État des réglages
  const [settings, setSettings] = useState<Settings>({
    enableVAT: false,
    vatPerLine: false,
    showQuantity: true,
    showUnit: false,
  });

  // État pour les données de l’émetteur chargées depuis l’API
  const [issuerData, setIssuerData] = useState<Issuer | null>(null);

  // Fonction pour charger l’émetteur depuis ton back
  const loadIssuer = async () => {
    try {
      const res = await fetch("/api/issuer");
      if (!res.ok) throw new Error("Erreur réseau");
      const data: Issuer = await res.json();
      setIssuerData(data);
    } catch (err) {
      console.error(err);
      alert("Impossible de charger l’émetteur");
    }
  };

  return (
    <div className={styles.dashboardLayout}>
      {/* Colonne 2 : panneau de réglages */}
      <SettingsPanel
        settings={settings}
        onChange={setSettings}
        onLoadIssuer={loadIssuer}
      />

      {/* Colonne 3 : formulaire */}
      <div className={styles.invoiceWrapper}>
        <InvoiceForm
          settings={settings}
          initialIssuer={issuerData}
        />
      </div>
    </div>
  );
}
