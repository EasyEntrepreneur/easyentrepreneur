// frontend/src/components/SettingsPanel.tsx
import { FC } from "react";
import styles from "./SettingsPanel.module.css";

export type Settings = {
  enableVAT: boolean;
  vatPerLine: boolean;
  showQuantity: boolean;
  showUnit: boolean;
  // … ajoute d’autres options ici
};

interface Props {
  settings: Settings;
  onChange: (newSettings: Settings) => void;
}

export const SettingsPanel: FC<Props> = ({ settings, onChange }) => {
  // Déclarez toggle ici
  const toggle = (key: keyof Settings) => {
    onChange({ ...settings, [key]: !settings[key] });
  };

  // Puis renvoyez votre JSX
  return (
    <aside className={styles.settingsPanel}>
      <h2>Réglages</h2>

      <div className={styles.field}>
        <label>Activer la TVA</label>
        <button onClick={() => toggle("enableVAT")}>
          {settings.enableVAT ? "Oui" : "Non"}
        </button>
      </div>

      {settings.enableVAT && (
        <div className={styles.field}>
          <label>TVA variable par ligne</label>
          <button onClick={() => toggle("vatPerLine")}>
            {settings.vatPerLine ? "Oui" : "Non"}
          </button>
        </div>
      )}

      <div className={styles.field}>
        <label>Quantité</label>
        <button onClick={() => toggle("showQuantity")}>
          {settings.showQuantity ? "Oui" : "Non"}
        </button>
      </div>

      <div className={styles.field}>
        <label>Unité</label>
        <button onClick={() => toggle("showUnit")}>
          {settings.showUnit ? "Oui" : "Non"}
        </button>
      </div>

      {/* etc. */}
    </aside>
  );
};
