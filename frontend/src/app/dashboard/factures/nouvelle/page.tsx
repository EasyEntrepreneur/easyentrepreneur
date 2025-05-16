// frontend/src/app/dashboard/factures/nouvelle/page.tsx
"use client";

import { useState } from "react";
import { SettingsPanel, Settings } from "@/components/SettingsPanel";
import InvoiceForm, { Issuer } from "@/components/InvoiceForm";
import styles from "./page.module.css";

export default function NewInvoicePage() {
  // 1) État des réglages
  const [settings, setSettings] = useState<Settings>({
    enableVAT: false,
    vatPerLine: false,
    showQuantity: true,
    showUnit: false,
  });

  // 2) État pour les données de l’émetteur
  const [issuerData, setIssuerData] = useState<Issuer | null>(null);

  // 3) fonction pour charger l’émetteur depuis ton back
  const loadIssuer = async () => {
    try {
      // Récupération du token stocké au login
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token d’authentification introuvable. Assure-toi d’être bien connecté.");
      }

      // Requête vers ton backend Express
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/issuer`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          // si tu utilises aussi un cookie de session :
          credentials: "include",
        }
      );

      if (!res.ok) {
        // 404 / 401 / 500 etc.
        throw new Error(`Erreur réseau : ${res.status}`);
      }

      const data: Issuer = await res.json();
      setIssuerData(data);
    } catch (err: any) {
      console.error("loadIssuer error →", err);
      alert(err.message || "Impossible de charger l’émetteur");
    }
  };

  console.log("🔄 issuerData state:", issuerData);
  return (
    <div className={styles.dashboardLayout}>
      {/* Colonne 1 : ta sidebar (déjà présente ailleurs) */}

      {/* Colonne 2 : panneau de réglages */}
      <SettingsPanel
        settings={settings}
        onChange={setSettings}
        onLoadIssuer={loadIssuer}  // nouveau prop
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
