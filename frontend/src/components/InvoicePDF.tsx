"use client";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet
} from "@react-pdf/renderer";

// UTILITAIRE DEVISE SANS SLASH, AVEC SÉPARATEUR D'ESPACE
const euro = (v: number) =>
  v != null
    ? v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202f/g, ' ') + " €"
    : "";

// STYLE VISUEL PRO + PROPRE
const styles = StyleSheet.create({
  page: {
    fontSize: 11,
    fontFamily: "Helvetica",
    backgroundColor: "#fff",
    padding: 32
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  emitterBlock: {
    width: "35%",
    fontWeight: "bold",
    marginTop: 12
  },
  invoiceTitle: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 2,
    marginRight: 0
  },
  clientBlock: {
    width: "35%",
    textAlign: "right",
    fontWeight: "bold",
    marginTop: 12
  },
  siret: {
    marginTop: 2,
    fontWeight: "normal"
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 18
  },
  dateLabel: {
    backgroundColor: "#E5EAFE",
    color: "#202060",
    padding: 6,
    borderRadius: 5,
    width: 130,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 11,
    marginRight: 10
  },
  dateValue: {
    fontWeight: "bold",
    fontSize: 11
  },
  table: {
    width: "100%",
    marginTop: 8,
    marginBottom: 8
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#dbeafe",
    minHeight: 26
  },
  tableHeader: {
    backgroundColor: "#e5eafe",
    fontWeight: "bold"
  },
  cellDesc: {
    flex: 3,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: "#dbeafe"
  },
  cellQty: {
    flex: 1,
    padding: 6,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#dbeafe"
  },
  cellPrice: {
    flex: 1.5,
    padding: 6,
    textAlign: "right",
    borderRightWidth: 1,
    borderRightColor: "#dbeafe"
  },
  cellTva: {
    flex: 1.2,
    padding: 6,
    textAlign: "right",
    borderRightWidth: 1,
    borderRightColor: "#dbeafe"
  },
  cellTotalHT: {
    flex: 1.7,
    padding: 6,
    textAlign: "right",
    borderRightWidth: 1,
    borderRightColor: "#dbeafe"
  },
  cellTotalTTC: {
    flex: 1.7,
    padding: 6,
    textAlign: "right"
  },
  totalsBox: {
    alignSelf: "flex-end",
    marginTop: 18,
    marginBottom: 10,
    width: 320,
    backgroundColor: "#e5eafe",
    borderRadius: 5,
    padding: 10
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 12,
    fontWeight: "bold"
  },
  totalsRowNormal: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 11
  },
  paiementBlock: {
    marginTop: 12,
    fontSize: 11
  },
  note: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 10,
    color: "#6B7280"
  }
});

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
  // --- SIRET client, format nombre, suppression "/" dans les prix
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Titre tout en haut à droite */}
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Text style={styles.invoiceTitle}>Facture N°{invoiceNumber}</Text>
        </View>
        {/* HEADER - Issuer / Client */}
        <View style={styles.headerRow}>
          {/* Émetteur à gauche */}
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
          {/* Client à droite */}
          <View style={styles.clientBlock}>
            <Text>{client.name}</Text>
            <Text>{client.address}</Text>
            <Text>
              {[client.zip, client.city].filter(Boolean).join(" ")}
            </Text>
            {client.siret && (
              <Text style={styles.siret}>SIRET : {client.siret}</Text>
            )}
            {client.vat && (
              <Text style={styles.siret}>TVA : {client.vat}</Text>
            )}
          </View>
        </View>
        {/* Date alignée sur la même ligne que le label */}
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Date de facture</Text>
          <Text style={styles.dateValue}>
            {typeof issuedAt === "string"
              ? new Date(issuedAt).toLocaleDateString("fr-FR")
              : issuedAt.toLocaleDateString("fr-FR")}
          </Text>
        </View>
        {/* Tableau */}
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
              <Text style={styles.cellTva}>{(item.vatRate || 0).toFixed(2)}</Text>
              <Text style={styles.cellTotalTTC}>{euro(item.totalTTC)}</Text>
            </View>
          ))}
        </View>
        {/* Totaux (PLUS DE DÉTAILS TVA PAR LIGNE) */}
        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text>Total HT</Text>
            <Text>{euro(totalHT)}</Text>
          </View>
          <View style={styles.totalsRowNormal}>
            <Text>Total TVA :</Text>
            <Text>{euro(totalTVA)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Total TTC</Text>
            <Text>{euro(totalTTC)}</Text>
          </View>
        </View>
        {/* Paiement */}
        {(paymentInfo || iban || bic) && (
          <View style={styles.paiementBlock}>
            {paymentInfo && <Text>{paymentInfo}</Text>}
            {iban && <Text>IBAN : {iban}</Text>}
            {bic && <Text>BIC : {bic}</Text>}
          </View>
        )}
        <Text style={styles.note}>
          TVA non applicable, art. 293B du CGI.
        </Text>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
