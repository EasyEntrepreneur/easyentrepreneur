"use client";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet
} from "@react-pdf/renderer";

// --- STYLES (adapte pour coller à ta maquette) ---
const PRIMARY = "#e6ecfc";
const HEADER_FONT = "#151c2b";
const HEADER_BG = "#eef2fc";
const CELL_BG = "#f3f6fc";

const styles = StyleSheet.create({
  page: {
    fontSize: 10.5,
    padding: 30,
    fontFamily: "Helvetica",
    backgroundColor: "#fff"
  },
  row: { flexDirection: "row" },
  between: { justifyContent: "space-between" },

  // Entêtes
  emetteurBlock: { width: "35%", fontWeight: "bold", color: HEADER_FONT },
  clientBlock: { width: "35%", marginLeft: "auto", textAlign: "right", fontWeight: "bold", color: HEADER_FONT },
  factureTitleBlock: { width: "30%", textAlign: "right" },

  factureTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 6,
    color: HEADER_FONT
  },
  label: { fontWeight: "bold", fontSize: 11 },
  value: { marginBottom: 2 },

  // Date de facture
  dateBar: {
    backgroundColor: PRIMARY,
    color: "#222",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 3,
    marginTop: 12,
    marginBottom: 12,
    alignSelf: "flex-start",
    fontWeight: "bold"
  },

  // Tableau
  table: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    marginTop: 8
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: CELL_BG,
    fontWeight: "bold",
    borderTop: `1px solid #e0e0e0`,
    borderBottom: `1px solid #e0e0e0`
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: `1px solid #e0e0e0`,
    minHeight: 20,
    alignItems: "center"
  },
  tableCell: {
    padding: 5,
    fontSize: 10,
    borderRight: `1px solid #f0f0f0`
  },
  cellDesc: { width: "38%" },
  cellQty: { width: "10%", textAlign: "center" },
  cellPU: { width: "16%", textAlign: "right" },
  cellTVA: { width: "12%", textAlign: "right" },
  cellHT: { width: "12%", textAlign: "right" },
  cellTTC: { width: "12%", textAlign: "right", borderRight: 0 },

  // Totaux
  totalRow: { flexDirection: "row", justifyContent: "flex-end" },
  totalBar: {
    backgroundColor: PRIMARY,
    color: "#151c2b",
    fontWeight: "bold",
    fontSize: 12,
    padding: 8,
    width: 170,
    textAlign: "right",
    borderRadius: 4,
    marginTop: 14
  },
  totalsCell: { width: 170, textAlign: "right", fontWeight: "bold", fontSize: 11 },

  // Paiement
  paymentInfo: {
    marginTop: 18,
    fontSize: 10.5,
    textAlign: "left"
  },

  // Mentions légales TVA
  note: {
    marginTop: 18,
    fontSize: 10,
    color: "#666",
    textAlign: "center"
  }
});

// --- PROPS TYPE ---
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
  invoiceNumber: string;
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
  invoiceNumber,
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
  // TVA(s) par taux
  const tvaMap: Record<string, number> = {};
  items.forEach(item => {
    const taux = (item.vatRate || 0).toFixed(2);
    tvaMap[taux] = (tvaMap[taux] || 0) + item.totalTVA;
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête émetteur/client */}
        <View style={[styles.row, styles.between]}>
          {/* Émetteur à gauche */}
          <View style={styles.emetteurBlock}>
            <Text style={styles.label}>{issuer.name || "Votre société"}</Text>
            <Text>{issuer.address || ""}</Text>
            <Text>
              {[issuer.zip, issuer.city].filter(Boolean).join(" ")}
            </Text>
            {issuer.siret && <Text>Siret : {issuer.siret}</Text>}
            {issuer.vat && <Text>TVA : {issuer.vat}</Text>}
          </View>
          {/* Titre facture et bloc client */}
          <View style={{ alignItems: "flex-end", flex: 1 }}>
            <Text style={styles.factureTitle}>Facture N°{invoiceNumber}</Text>
            <View style={styles.clientBlock}>
              <Text style={styles.label}>{client.name}</Text>
              <Text>{client.address}</Text>
              <Text>
                {[client.zip, client.city].filter(Boolean).join(" ")}
              </Text>
              {client.siret && <Text>Siret : {client.siret}</Text>}
              {client.vat && <Text>TVA : {client.vat}</Text>}
            </View>
          </View>
        </View>

        {/* Date dans barre bleue */}
        <Text style={styles.dateBar}>
          Date de facture : {typeof issuedAt === "string"
            ? new Date(issuedAt).toLocaleDateString("fr-FR")
            : issuedAt.toLocaleDateString("fr-FR")}
        </Text>

        {/* Tableau des lignes */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.cellDesc]}>Description</Text>
            <Text style={[styles.tableCell, styles.cellQty]}>Quantité</Text>
            <Text style={[styles.tableCell, styles.cellPU]}>Prix unitaire HT</Text>
            <Text style={[styles.tableCell, styles.cellTVA]}>TVA</Text>
            <Text style={[styles.tableCell, styles.cellHT]}>Prix total HT</Text>
            <Text style={[styles.tableCell, styles.cellTTC]}>Prix total TTC</Text>
          </View>
          {/* Rows */}
          {items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.cellDesc]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.cellQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.cellPU]}>{item.unitPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</Text>
              <Text style={[styles.tableCell, styles.cellTVA]}>{(item.vatRate || 0).toFixed(2)} %</Text>
              <Text style={[styles.tableCell, styles.cellHT]}>{item.totalHT.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</Text>
              <Text style={[styles.tableCell, styles.cellTTC]}>{item.totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</Text>
            </View>
          ))}
        </View>

        {/* Bloc total à droite dans bandeau bleu */}
        <View style={styles.totalRow}>
          <Text style={styles.totalBar}>Total HT&nbsp;&nbsp;{totalHT.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</Text>
        </View>

        {/* TVA(s) par taux */}
        {Object.entries(tvaMap).map(([taux, montant]) => (
          <View style={styles.totalRow} key={taux}>
            <Text style={styles.totalsCell}>TVA {taux} % : {montant.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</Text>
          </View>
        ))}

        {/* Total TVA et TTC */}
        <View style={styles.totalRow}>
          <Text style={styles.totalsCell}>Total TVA : {totalTVA.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalsCell}>Total TTC : {totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</Text>
        </View>

        {/* Infos paiement et mention TVA */}
        <View style={{ flexDirection: "row", marginTop: 28 }}>
          <View style={{ flex: 1 }}>
            {(paymentInfo || iban || bic) && (
              <View style={styles.paymentInfo}>
                <Text>Informations de paiement :</Text>
                {paymentInfo && <Text>{paymentInfo}</Text>}
                {iban && <Text>IBAN : {iban}</Text>}
                {bic && <Text>BIC : {bic}</Text>}
              </View>
            )}
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            {/* Vide ou autres infos à ajouter */}
          </View>
        </View>
        <Text style={styles.note}>
          TVA non applicable, art. 293B du CGI.
        </Text>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
