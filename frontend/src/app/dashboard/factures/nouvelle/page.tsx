"use client";

import { useState, useEffect } from "react";
import { SettingsPanel, Settings } from "@/components/SettingsPanel";
import InvoiceForm, { Issuer } from "@/components/InvoiceForm";
import styles from "./page.module.css";

// Type Client
export type Client = {
  id: string;
  name: string;
  address: string;
  zip: string;
  city: string;
  siret: string;
  vat?: string;
  phone?: string;
};

export default function NewInvoicePage() {
  const [settings, setSettings] = useState<Settings>({
    enableVAT: false,
    vatPerLine: false,
    vatRate: 20,
    showQuantity: true,
    showUnit: false,
  });

  // Émetteur
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [selectedIssuerId, setSelectedIssuerId] = useState<string>("");
  const [issuerData, setIssuerData] = useState<Issuer | null>(null);

  // Client
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientData, setClientData] = useState<Client | null>(null);

  // Fetch issuers
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
        setIssuers([{ ...data, id: data.siret }]);
        setSelectedIssuerId(data.siret);
      } catch (err) {
        console.error("fetchIssuers error →", err);
      }
    }
    fetchIssuers();
  }, []);

  // Fetch clients
  useEffect(() => {
    async function fetchClients() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/client`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) return;

        const data: Client[] = await res.json();
        setClients(data);
        if (data.length > 0) setSelectedClientId(data[0].id);
      } catch (err) {
        console.error("fetchClients error →", err);
      }
    }
    fetchClients();
  }, []);

  // Charger émetteur
  useEffect(() => {
    if (!selectedIssuerId) return;
    const issuer = issuers.find((i) => i.id === selectedIssuerId);
    if (issuer) setIssuerData(issuer);
  }, [selectedIssuerId, issuers]);

  // Charger client
  useEffect(() => {
    if (!selectedClientId) return;
    const client = clients.find((c) => c.id === selectedClientId);
    if (client) setClientData(client);
  }, [selectedClientId, clients]);

  // Pour bouton "Charger" côté émetteur
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

  // Pour bouton "Charger" côté client
  const loadClient = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/client/${selectedClientId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Client = await res.json();
      setClientData(data);
    } catch (err) {
      console.error("loadClient error →", err);
      alert("Impossible de charger le client");
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
        clients={clients}
        selectedClientId={selectedClientId}
        onSelectClient={setSelectedClientId}
        onLoadClient={loadClient}
      />

      <div className={styles.invoiceWrapper}>
        <InvoiceForm
          settings={settings}
          initialIssuer={issuerData}
          initialClient={clientData}
        />
      </div>
    </div>
  );
}
