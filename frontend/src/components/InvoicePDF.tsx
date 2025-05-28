"use client";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet
} from "@react-pdf/renderer";

// Utilitaire devise
const euro = (v: number) =>
  v != null
    ? v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\u202f/g, ' ') + " €"
    : "";

// Styles adaptés à la demande
const styles = StyleSheet.create({
  page: {
    fontSize: 11,
    fontFamily: "Helvetica",
    backgroundColor: "#fff",
    padding: 32
  },
  // Titre facture N°...
  invoiceTitleRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8
  },
  invoiceTitle: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "right",
  },
  // Blocs infos émetteur/client
  headerGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14
  },
  issuerBlock: {
    width: "48%",
    flexDirection: "column",
    justifyContent: "flex-start"
  },
  clientBlockWrapper: {
    width: "48%",
    flexDirection: "column",
    alignItems: "flex-end"
  },
  clientBlock: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginTop: 34 // décalage client sous émetteur
  },
  label: { fontWeight: "bold", fontSize: 11 },
  siret: { marginTop: 2, fontWeight: "normal" },

  // Date facture (label + date sur une ligne)
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    marginTop: 8
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

  // Tableau lignes facture
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

  // Bloc totaux à droite, max 50%
  totalsBox: {
    alignSelf: "flex-end",
    marginTop: 24,
    marginBottom: 10,
    width: "48%",
    maxWidth: 270,
    backgroundColor: "#e5eafe",
    borderRadius: 5,
    padding: 14
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4
  },
  totalsRowNormal: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 11,
    marginBottom: 4
  },
  paiementBlock: {
    marginTop: 18,
    fontSize: 11
  },
  note: {
    marginTop: 28,
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
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Titre seul en haut à droite */}
        <View style={styles.invoiceTitleRow}>
          <Text style={styles.invoiceTitle}>Facture N°{invoiceNumber}</Text>
        </View>

        {/* Bloc émetteur à gauche, client en bas à droite */}
        <View style={styles.headerGrid}>
          {/* Émetteur à gauche */}
          <View style={styles.issuerBlock}>
            <Text style={styles.label}>{issuer.name}</Text>
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
          {/* Bloc vide pour que client soit décalé en bas à droite */}
          <View style={styles.clientBlockWrapper}>
            <View style={styles.clientBlock}>
              <Text style={styles.label}>{client.name}</Text>
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
        </View>

        {/* Date alignée */}
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Date de facture</Text>
          <Text style={styles.dateValue}>
            {typeof issuedAt === "string"
              ? new Date(issuedAt).toLocaleDateString("fr-FR")
              : issuedAt.toLocaleDateString("fr-FR")}
          </Text>
        </View>

        {/* Tableau des lignes */}
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

        {/* Totaux (50% max largeur, aligné à droite) */}
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

        {/* Infos paiement */}
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
