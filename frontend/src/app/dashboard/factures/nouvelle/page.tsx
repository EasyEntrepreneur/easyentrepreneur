// frontend/src/app/dashboard/factures/nouvelle/page.tsx
"use client";

import { useState } from "react";
import { SettingsPanel, Settings } from "@/components/SettingsPanel";
import InvoiceForm from "@/components/InvoiceForm";

export default function NewInvoicePage() {
  // 1) État du panneau de réglages
  const [settings, setSettings] = useState<Settings>({
    enableVAT: false,
    vatPerLine: false,
    showQuantity: true,
    showUnit: false,
  });

  return (
    <div className="dashboardLayout">

      {/* 3) Panneau Réglages */}
      <SettingsPanel settings={settings} onChange={setSettings} />

      {/* 4) Wrapper pour le formulaire */}
      <div className="invoiceWrapper">
        <InvoiceForm settings={settings} />
      </div>
    </div>
  );
}
