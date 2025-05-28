"use client";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet
} from "@react-pdf/renderer";

// UTIL
const euro = (v: number) =>
  typeof v === "number" ? v.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €" : "";

const styles = StyleSheet.create({
  page: {
    fontSize: 11,
    fontFamily: "Helvetica",
    backgroundColor: "#fff",
    padding: 32
  },
  // HEADER & TITRE
  invoiceTitle: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 6,
    marginTop: 0
  },
  headerBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12
  },
  emitterBlock: {
    width: "46%",
    fontWeight: "bold"
  },
  // Date
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  dateLabel: {
    backgroundColor: "#e5eafe",
    color: "#202060",
    padding: 6,
    borderRadius: 5,
    minWidth: 108,
    textAlign: "center",
    fontWeight: "bold",
    marginRight: 8
  },
  dateValue: {
    fontSize: 12,
    fontWeight: 500,
    color: "#222"
  },
  // CLIENT INFO align right, sous émetteur
  clientBlockWrap: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "100%"
  },
  clientBlock: {
    width: "48%",
    textAlign: "right",
    fontWeight: "bold",
    marginTop: 8 // démarre sous l'émetteur
  },
  clientSiret: {
    fontWeight: "normal",
    fontSize: 10,
    marginTop: 2
  },
  siret: {
    fontWeight: "normal",
    fontSize: 10,
    marginTop: 2
  },
  // TABLEAU
  table: {
    width: "100%",
    borderWidth: 0,
    marginTop: 10,
    marginBottom: 12
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#dbeafe",
    minHeight: 28
  },
  tableHeader: {
    backgroundColor: "#e5eafe",
    fontWeight: "bold"
  },
  cellDesc: { flex: 3, padding: 6, borderRightWidth: 1, borderRightColor: "#dbeafe" },
  cellQty: { flex: 1, padding: 6, textAlign: "center", borderRightWidth: 1, borderRightColor: "#dbeafe" },
  cellPrice: { flex: 1.5, padding: 6, textAlign: "right", borderRightWidth: 1, borderRightColor: "#dbeafe" },
  cellTotalHT: { flex: 1.7, padding: 6, textAlign: "right", borderRightWidth: 1, borderRightColor: "#dbeafe" },
  cellTva: { flex: 1.2, padding: 6, textAlign: "right", borderRightWidth: 1, borderRightColor: "#dbeafe" },
  cellTotalTTC: { flex: 1.7, padding: 6, textAlign: "right" },
  // TOTALS TABLE
  totalsBox: {
    alignSelf: "flex-end",
    width: "50%",
    backgroundColor: "#e5eafe",
    borderRadius: 5,
    marginTop: 18,
    marginBottom: 10,
    padding: 0
  },
  totalsTable: {
    width: "100%",
    borderCollapse: "collapse"
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 12,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#c7d6fa",
    paddingVertical: 7,
    paddingHorizontal: 12
  },
  totalsRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 12,
    fontWeight: "bold",
    paddingVertical: 7,
    paddingHorizontal: 12
  },
  totalsLabel: {
    flex: 1,
    textAlign: "left"
  },
  totalsValue: {
    flex: 1,
    textAlign: "right",
    fontWeight: "bold"
  },
  // PAIEMENT INFOS
  paiementBlock: {
    marginTop: 22,
    fontSize: 11,
    width: "80%"
  },
  // LEGAL NOTE
  note: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 10,
    color: "#6B7280"
  }
});

// --- PROPS ---
type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
};
type CompanyInfo = {
  name?: string;
  address?: string;
  zip?: string;
  city?: string;
  siret?: string;
  vat?: string;
};
type InvoicePDFProps = {
  invoiceTitle: string; // <- Ajouté pour coller à InvoiceForm.tsx
  issuedAt: string | Date;
  statut: string;
  issuer: CompanyInfo;
  client: {
    name: string;
    address: string;
    zip: string;
    city: string;
    phone?: string;
    email?: string;
    vat?: string;
    siret?: string;
  };
  items: InvoiceItem[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  paymentInfo?: string | null;
  iban?: string | null;
  bic?: string | null;
};

export const InvoicePDF = ({
  invoiceTitle,
  issuedAt,
  statut,
  issuer,
  client,
  items,
  totalHT,
  totalTVA,
  totalTTC,
  paymentInfo,
  iban,
  bic
}: InvoicePDFProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* TITRE EN HAUT DROITE */}
        <Text style={styles.invoiceTitle}>
          {invoiceTitle}
        </Text>

        {/* HEADER INFOS */}
        <View style={styles.headerBlock}>
          {/* Emetteur à gauche */}
          <View style={styles.emitterBlock}>
            <Text>{issuer.name}</Text>
            <Text>{issuer.address}</Text>
            <Text>
              {[issuer.zip, issuer.city].filter(Boolean).join(" ")}
            </Text>
            {issuer.siret && (
              <Text style={styles.siret}>SIRET : {issuer.siret}</Text>
            )}
            {issuer.vat && (
              <Text style={styles.siret}>TVA : {issuer.vat}</Text>
            )}
          </View>
        </View>

        {/* INFOS CLIENT EN DESSOUS À DROITE */}
        <View style={styles.clientBlockWrap}>
          <View style={styles.clientBlock}>
            <Text>{client.name}</Text>
            <Text>{client.address}</Text>
            <Text>
              {[client.zip, client.city].filter(Boolean).join(" ")}
            </Text>
            {client.siret && (
              <Text style={styles.clientSiret}>SIRET : {client.siret}</Text>
            )}
            {client.vat && (
              <Text style={styles.clientSiret}>TVA : {client.vat}</Text>
            )}
          </View>
        </View>

        {/* DATE */}
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Date de facture</Text>
          <Text style={styles.dateValue}>
            {typeof issuedAt === "string"
              ? new Date(issuedAt).toLocaleDateString("fr-FR")
              : issuedAt.toLocaleDateString("fr-FR")}
          </Text>
        </View>

        {/* TABLEAU DES LIGNES */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.cellDesc}>Description</Text>
            <Text style={styles.cellQty}>Quantité</Text>
            <Text style={styles.cellPrice}>Prix unitaire HT</Text>
            <Text style={styles.cellTotalHT}>Prix total HT</Text>
            <Text style={styles.cellTva}>TVA (%)</Text>
            <Text style={styles.cellTotalTTC}>Prix total TTC</Text>
          </View>
          {items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.cellDesc}>{item.description}</Text>
              <Text style={styles.cellQty}>{item.quantity}</Text>
              <Text style={styles.cellPrice}>{euro(item.unitPrice)}</Text>
              <Text style={styles.cellTotalHT}>{euro(item.totalHT)}</Text>
              <Text style={styles.cellTva}>{(item.vatRate || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</Text>
              <Text style={styles.cellTotalTTC}>{euro(item.totalTTC)}</Text>
            </View>
          ))}
        </View>

        {/* TOTAUX - TABLEAU à droite */}
        <View style={styles.totalsBox}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Total HT</Text>
              <Text style={styles.totalsValue}>{euro(totalHT)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Total TVA :</Text>
              <Text style={styles.totalsValue}>{euro(totalTVA)}</Text>
            </View>
            <View style={styles.totalsRowLast}>
              <Text style={styles.totalsLabel}>Total TTC</Text>
              <Text style={styles.totalsValue}>{euro(totalTTC)}</Text>
            </View>
          </View>
        </View>

        {/* INFOS DE PAIEMENT */}
        {(paymentInfo || iban || bic) && (
          <View style={styles.paiementBlock}>
            <Text>Informations de paiement :</Text>
            {paymentInfo && <Text>{paymentInfo}</Text>}
            {iban && <Text>IBAN : {iban}</Text>}
            {bic && <Text>BIC : {bic}</Text>}
          </View>
        )}

        {/* LEGAL */}
        <Text style={styles.note}>
          TVA non applicable, art. 293B du CGI.
        </Text>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
