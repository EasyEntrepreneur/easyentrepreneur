"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import styles from "./InvoiceForm.module.css";
import { Settings } from "@/components/SettingsPanel";
import QuotePreview from "@/components/QuotePreview";

export type Issuer = {
  id?: string;
  name: string;
  address: string;
  zip: string;
  city: string;
  siret: string;
  vat?: string;
  phone?: string;
};

type Client = {
  name: string;
  address: string;
  zip: string;
  city: string;
  siret?: string;
  vat?: string;
  phone?: string;
};

type Item = {
  description: string;
  quantity: number;
  unitPrice: number;
};

interface QuoteFormProps {
  settings: Settings;
  initialIssuer?: Issuer | null;
  initialClient?: Client | null;
}

export default function QuoteForm({
  settings,
  initialIssuer = null,
  initialClient = null,
}: QuoteFormProps) {
  const router = useRouter();

  // ÉMETTEUR
  const [issuer, setIssuer] = useState({
    name: "",
    address: "",
    zip: "",
    city: "",
    siret: "",
  });
  const [quoteTitle, setQuoteTitle] = useState("Devis N°1");
  const [showIssuerTva, setShowIssuerTva] = useState(true);
  const [issuerTva, setIssuerTva] = useState("");
  const [showIssuerPhone, setShowIssuerPhone] = useState(true);
  const [issuerPhone, setIssuerPhone] = useState("");
  const [issuerExtra, setIssuerExtra] = useState<string[]>([]);

  // CLIENT
  const [client, setClient] = useState<Client>({
    name: "",
    address: "",
    zip: "",
    city: "",
    siret: "",
    vat: "",
    phone: "",
  });
  const [showClientPhone, setShowClientPhone] = useState(true);
  const [clientPhone, setClientPhone] = useState("");
  const [clientExtra, setClientExtra] = useState<string[]>([]);

  // DATE
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));

  // LIGNES DE DEVIS
  const [items, setItems] = useState<Item[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  // TVA PAR LIGNE
  const [lineVats, setLineVats] = useState<number[]>(
    items.map(() => settings.vatRate)
  );
  useEffect(() => {
    setLineVats((old) => {
      const copy = [...old];
      if (copy.length < items.length) {
        // ajout de ligne
        return [...copy, settings.vatRate];
      } else if (copy.length > items.length) {
        // suppression de ligne
        return copy.slice(0, items.length);
      }
      return copy;
    });
  }, [items.length, settings.vatRate]);

  const handleLineVatChange = (index: number, value: string) => {
    const val = parseFloat(value) || 0;
    setLineVats((old) => {
      const copy = [...old];
      copy[index] = val;
      return copy;
    });
  };

  // FOOTER
  const [paymentInfo, setPaymentInfo] = useState("");
  const [legalNote, setLegalNote] = useState(
    "TVA non applicable, art. 293B du CGI"
  );

  // CALCULS
  const totalHT = items.reduce(
    (sum, it) => sum + it.quantity * it.unitPrice,
    0
  );
  const totalVAT = settings.enableVAT
    ? settings.vatPerLine
      ? items.reduce(
          (sum, it, idx) =>
            sum + it.quantity * it.unitPrice * (lineVats[idx] / 100),
          0
        )
      : totalHT * (settings.vatRate / 100)
    : 0;
  const totalTTC = totalHT + totalVAT;

  // PRÉ-REMPLISSAGE ÉMETTEUR / CLIENT
  useEffect(() => {
    if (initialIssuer) {
      setIssuer({
        name: initialIssuer.name,
        address: initialIssuer.address,
        zip: initialIssuer.zip,
        city: initialIssuer.city,
        siret: initialIssuer.siret,
      });
      setIssuerTva(initialIssuer.vat || "");
      setIssuerPhone(initialIssuer.phone || "");
    }
  }, [initialIssuer]);
  useEffect(() => {
    if (initialClient) {
      setClient({
        name: initialClient.name || "",
        address: initialClient.address || "",
        zip: initialClient.zip || "",
        city: initialClient.city || "",
        siret: initialClient.siret || "",
        vat: initialClient.vat || "",
        phone: initialClient.phone || "",
      });
      setClientPhone(initialClient.phone || "");
    }
  }, [initialClient]);

  // HANDLERS LIGNES
  const handleItemChange = (
    index: number,
    field: keyof Item,
    value: string
  ) => {
    const updated = [...items];
    if (field === "quantity" || field === "unitPrice") {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      (updated[index] as any)[field] = value;
    }
    setItems(updated);
  };
  const addItem = () =>
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) =>
    setItems(items.filter((_, idx) => idx !== i));

  // HANDLERS CHAMPS LIBRES ÉMETTEUR
  const addIssuerField = () => setIssuerExtra([...issuerExtra, ""]);
  const updateIssuerField = (i: number, val: string) => {
    const u = [...issuerExtra];
    u[i] = val;
    setIssuerExtra(u);
  };
  const removeIssuerField = (i: number) =>
    setIssuerExtra(issuerExtra.filter((_, idx) => idx !== i));

  // HANDLERS CHAMPS LIBRES CLIENT
  const addClientField = () => setClientExtra([...clientExtra, ""]);
  const updateClientField = (i: number, val: string) => {
    const u = [...clientExtra];
    u[i] = val;
    setClientExtra(u);
  };
  const removeClientField = (i: number) =>
    setClientExtra(clientExtra.filter((_, idx) => idx !== i));

  // ==== AJOUT POUR GÉNÉRATION HTML PDF ====
  const previewRef = useRef<HTMLDivElement>(null);

  // --- SOUMISSION DU FORMULAIRE ---
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const clientPayload = {
      name: client.name,
      address: client.address,
      zip: client.zip,
      city: client.city,
      siret: client.siret,
      vat: client.vat,
      phone: clientPhone,
    };

    const itemsPayload = items.map((item, i) => ({
      ...item,
      vatRate: settings.enableVAT
        ? settings.vatPerLine
          ? lineVats[i]
          : settings.vatRate
        : 0,
    }));

    // ==== RÉCUPÈRE LE HTML DU PREVIEW ====
    let quoteHtml = "";
    if (previewRef.current) {
      const previewHtml = previewRef.current.innerHTML;
      const style = `
        <style>
          .table th, .dateLabel {
            background: #6B8DFC !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        </style>
      `;
      quoteHtml = `
        <html>
          <head>
            <meta charset="UTF-8" />
            ${style}
          </head>
          <body>
            ${previewHtml}
          </body>
        </html>
      `;
    }

    const payload = {
      client: clientPayload,
      items: itemsPayload,
      paymentInfo,
      legalNote,
      date,
      settings,
      totalHT,
      totalVAT,
      totalTTC,
      quoteHtml,
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Non authentifié");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 403) {
        const data = await res.json();
        toast.error(data.error || "Quota atteint : Vous avez atteint la limite de documents avec l’offre FREEMIUM. Passez à une offre supérieure pour continuer.", {
          duration: 7000,
        });
        setLoading(false);
        return;
      }

      if (!res.ok) {
        let message = "Erreur lors de la création du devis !";
        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {}
        toast.error(message, { duration: 5000 });
        setLoading(false);
        return;
      }

      let pdfUrl = null;
      let quoteId = null;
      let quoteNumber = null;
      try {
        const data = await res.json();
        quoteId = data?.id || data?.quoteId || null;
        pdfUrl = data?.pdfUrl || null;
        quoteNumber = data?.number || null;
      } catch {}

      sessionStorage.setItem(
        "showQuoteToast",
        JSON.stringify({
          number: quoteNumber,
          pdfUrl: `/dashboard/devis/${quoteNumber}/pdf`
        })
      );

      router.push("/dashboard/devis");

    } catch (err: any) {
      toast.error(
        err?.message || "Erreur lors de la création du devis !",
        { duration: 5000 }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        {/* ── HEADER ─────────────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            <input
              className={styles.titleInput}
              value={quoteTitle}
              onChange={e => setQuoteTitle(e.target.value)}
            />
          </h1>
          {/* ÉMETTEUR */}
          <div className={styles.issuer}>
            <input
              className={styles.inputAuto}
              placeholder="Nom complet"
              value={issuer.name}
              onChange={(e) =>
                setIssuer((p) => ({ ...p, name: e.target.value }))
              }
            />
            <input
              className={styles.inputAuto}
              placeholder="Adresse"
              value={issuer.address}
              onChange={(e) =>
                setIssuer((p) => ({ ...p, address: e.target.value }))
              }
            />
            <div className={styles.flexLine}>
              <input
                className={styles.inputAuto}
                placeholder="Code postal"
                value={issuer.zip}
                onChange={(e) =>
                  setIssuer((p) => ({ ...p, zip: e.target.value }))
                }
              />
              <input
                className={styles.inputAuto}
                placeholder="Ville"
                value={issuer.city}
                onChange={(e) =>
                  setIssuer((p) => ({ ...p, city: e.target.value }))
                }
              />
            </div>
            <input
              className={styles.inputAuto}
              placeholder="SIRET"
              value={issuer.siret}
              onChange={(e) =>
                setIssuer((p) => ({ ...p, siret: e.target.value }))
              }
            />

            {/* TVA émetteur */}
            {showIssuerTva && (
              <div className={styles.fieldRowRight}>
                <input
                  className={styles.inputAuto}
                  placeholder="N° TVA"
                  value={issuerTva}
                  onChange={(e) => setIssuerTva(e.target.value)}
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

            {/* Téléphone émetteur */}
            {showIssuerPhone && (
              <div className={styles.fieldRowRight}>
                <input
                  className={styles.inputAuto}
                  placeholder="Tél"
                  value={issuerPhone}
                  onChange={(e) => setIssuerPhone(e.target.value)}
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

            {/* Champs libres Émetteur */}
            {issuerExtra.map((val, i) => (
              <div key={i} className={styles.fieldRowRight}>
                <input
                  className={styles.inputAuto}
                  placeholder="Champ"
                  value={val}
                  onChange={(e) => updateIssuerField(i, e.target.value)}
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

            {/* + champ Émetteur */}
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
              onChange={(e) =>
                setClient((p) => ({ ...p, name: e.target.value }))
              }
            />
            <input
              className={styles.inputAuto}
              placeholder="Adresse"
              value={client.address}
              onChange={(e) =>
                setClient((p) => ({ ...p, address: e.target.value }))
              }
            />
            <div className={styles.flexLine}>
              <input
                className={styles.inputAuto}
                placeholder="Code postal"
                value={client.zip}
                onChange={(e) =>
                  setClient((p) => ({ ...p, zip: e.target.value }))
                }
              />
              <input
                className={styles.inputAuto}
                placeholder="Ville"
                value={client.city}
                onChange={(e) =>
                  setClient((p) => ({ ...p, city: e.target.value }))
                }
              />
            </div>
            <input
              className={styles.inputAuto}
              placeholder="SIRET"
              value={client.siret}
              onChange={(e) =>
                setClient((p) => ({ ...p, siret: e.target.value }))
              }
            />

            {/* Téléphone client */}
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
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
            )}

            {/* Champs libres Client */}
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
                  onChange={(e) => updateClientField(i, e.target.value)}
                />
              </div>
            ))}

            {/* + champ Client */}
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
              <td className={styles.dateLabel}>Date du devis</td>
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
              {settings.enableVAT && settings.vatPerLine && (
                <>
                  <th>TVA&nbsp;(%)</th>
                  <th>Total TTC</th>
                </>
              )}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>
                  <textarea
                    rows={1}
                    value={it.description}
                    onChange={e => handleItemChange(i, "description", e.target.value)}
                    ref={el => {
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = el.scrollHeight + 'px';
                        const charWidth = 8;
                        const minWidth = 120;
                        const maxWidth = 320;
                        const width = Math.max(
                          minWidth,
                          Math.min(el.value.length * charWidth, maxWidth)
                        );
                        el.style.width = width + 'px';
                      }
                    }}
                    style={{
                      border: "none",
                      resize: "none",
                      overflow: "hidden",
                      minWidth: 200,
                      minHeight: 30,
                      maxWidth: 320,
                    }}
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
                {settings.enableVAT && settings.vatPerLine && (
                  <>
                    <td>
                      <input
                        type="number"
                        className={styles.smallInput}
                        value={lineVats[i]}
                        onChange={(e) =>
                          handleLineVatChange(i, e.target.value)
                        }
                      />
                    </td>
                    <td>
                      {(it.quantity *
                        it.unitPrice *
                        (1 + lineVats[i] / 100)
                      ).toFixed(2)}{" "}
                      €
                    </td>
                  </>
                )}
                <td>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeItem(i)}
                  >
                    −
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.addBtnContainer}>
          <button
            type="button"
            className={styles.addLine}
            onClick={addItem}
          >
            ＋
          </button>
        </div>

        {/* FOOTER */}
        <div className={styles.footerRow}>
          <textarea
            rows={1}
            className={styles.payment}
            placeholder="Informations complémentaires (validité du devis, conditions, etc.)"
            value={paymentInfo}
            onChange={(e) => setPaymentInfo(e.target.value)}
            ref={el => {
              if (el) {
                el.style.height = 'auto';
                el.style.height = el.scrollHeight + 'px';
                const charWidth = 8;
                const minWidth = 360;
                const maxWidth = 600;
                const width = Math.max(
                  minWidth,
                  Math.min(el.value.length * charWidth, maxWidth)
                );
                el.style.width = width + 'px';
              }
            }}
            style={{
              border: "none",
              resize: "none",
              overflow: "hidden",
              minWidth: 240,
              minHeight: 30,
              maxWidth: 600,
            }}
          />
          <div className={styles.summary}>
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
            <div className={styles.totalTTC}>
              <strong>Total TTC</strong>
              <strong>{totalTTC.toFixed(2)} €</strong>
            </div>
          </div>
        </div>

        <textarea
          rows={1}
          className={styles.legal}
          value={legalNote}
          onChange={(e) => setLegalNote(e.target.value)}
          ref={el => {
            if (el) {
              el.style.height = 'auto';
              el.style.height = el.scrollHeight + 'px';
              const charWidth = 8;
              const minWidth = 600;
              const maxWidth = 900;
              const width = Math.max(
                minWidth,
                Math.min(el.value.length * charWidth, maxWidth)
              );
              el.style.width = width + 'px';
            }
          }}
          style={{
            border: "none",
            resize: "none",
            overflow: "hidden",
            minWidth: 600,
            minHeight: 30,
            maxWidth: 900,
          }}
        />

        <button
          type="submit"
          className={styles.submit}
          disabled={loading}
        >
          {loading ? (
            <span>
              <span className={styles.spinner} /> Génération...
            </span>
          ) : (
            "Générer le devis"
          )}
        </button>
      </form>

      {/* PREVIEW CACHÉ POUR PDF */}
      <div ref={previewRef} style={{ display: "none" }}>
        <QuotePreview
          issuer={{
            ...issuer,
            vat: issuerTva,
            phone: issuerPhone,
            extra: issuerExtra,
          }}
          client={{
            ...client,
            phone: clientPhone,
            extra: clientExtra,
          }}
          items={items.map((it, i) => ({
            ...it,
            vatRate: settings.enableVAT
              ? settings.vatPerLine
                ? lineVats[i]
                : settings.vatRate
              : 0,
          }))}
          date={date}
          QuoteTitle={quoteTitle}
          settings={settings}
          paymentInfo={paymentInfo}
          legalNote={legalNote}
          totalHT={totalHT}
          totalVAT={totalVAT}
          totalTTC={totalTTC}
        />
      </div>
    </>
  );
}
