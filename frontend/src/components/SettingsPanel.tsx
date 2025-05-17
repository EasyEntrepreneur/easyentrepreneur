// frontend/src/components/SettingsPanel.tsx
import { FC } from "react";
import styles from "./SettingsPanel.module.css";
import type { Issuer } from "./InvoiceForm";

export type Settings = {
  enableVAT: boolean;
  vatPerLine: boolean;
  vatRate: number;
  showQuantity: boolean;
  showUnit: boolean;
};

// 👇 Ajoute le type Client
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

interface Props {
  settings: Settings;
  onChange: (newSettings: Settings) => void;
  issuers: Issuer[];
  selectedIssuerId: string;
  onSelectIssuer: (id: string) => void;
  onLoadIssuer: () => void;

  clients: Client[];                      // 👈
  selectedClientId: string;               // 👈
  onSelectClient: (id: string) => void;   // 👈
  onLoadClient: () => void;               // 👈
}

export const SettingsPanel: FC<Props> = ({
  settings,
  onChange,
  issuers,
  selectedIssuerId,
  onSelectIssuer,
  onLoadIssuer,
  clients,
  selectedClientId,
  onSelectClient,
  onLoadClient,
}) => {
  const toggle = (key: keyof Settings) => {
    onChange({ ...settings, [key]: !settings[key] });
  };

  const updateVatRate = (val: string) => {
    const rate = parseFloat(val) || 0;
    onChange({ ...settings, vatRate: rate });
  };

  return (
    <aside className={styles.settingsPanel}>
      <h2>Réglages</h2>

      <div className={styles.field}>
        <label>Activer la TVA</label>
        <button onClick={() => toggle("enableVAT")}>
          {settings.enableVAT ? "Oui" : "Non"}
        </button>
      </div>

      {settings.enableVAT && !settings.vatPerLine && (
        <div className={styles.field}>
          <label>Taux TVA&nbsp;(%)</label>
          <input
            type="number"
            className={styles.smallInput}
            value={settings.vatRate}
            onChange={(e) => updateVatRate(e.target.value)}
          />
        </div>
      )}

      {settings.enableVAT && (
        <div className={styles.field}>
          <label>TVA par ligne</label>
          <button onClick={() => toggle("vatPerLine")}>
            {settings.vatPerLine ? "Oui" : "Non"}
          </button>
        </div>
      )}

      <div className={styles.field}>
        <label>Nom émetteur</label>
        <select
          className={styles.issuerSelect}
          value={selectedIssuerId}
          onChange={(e) => onSelectIssuer(e.target.value)}
        >
          {issuers.map((iss) => (
            <option key={iss.id!} value={iss.id!}>
              {iss.name}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <button onClick={onLoadIssuer}>Charger émetteur</button>
      </div>

      {/* --- CLIENT --- */}
      <div className={styles.field}>
        <label>Nom client</label>
        <select
          className={styles.issuerSelect}
          value={selectedClientId}
          onChange={(e) => onSelectClient(e.target.value)}
        >
          {clients.map((cl) => (
            <option key={cl.id} value={cl.id}>
              {cl.name}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <button onClick={onLoadClient}>Charger client</button>
      </div>
    </aside>
  );
};
