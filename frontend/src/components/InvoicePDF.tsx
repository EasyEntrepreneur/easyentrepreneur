"use client";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet
} from "@react-pdf/renderer";

// Formatage robuste des montants (corrige "1/000" et autres formats douteux)
const formatEuro = (v: number | string) => {
  if (typeof v === "string") {
    v = v.replace(/[^\d.,-]/g, "").replace(",", ".");
  }
  const n = Number(v);
  if (isNaN(n)) return typeof v === "string" ? v + " €" : "0,00 €";
  return (
    n
      .toLocaleString("fr-FR", { minimumFractionDigits: 2 })
      .replace(/\u202F|\u00A0/g, " ") // Séparateur espace insécable → espace simple
      .replace(/\//g, " ") // Sécurité si jamais
    + " €"
  );
};

const styles = StyleSheet.create({
  page: {
    fontSize: 11,
    fontFamily: "Helvetica",
    backgroundColor: "#fff",
    padding: 32
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 2,
    color: "#151c2b"
  },
  headerBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 0,
    width: "100%"
  },
  emitterBlock: {
    width: "100%",
    fontWeight: "bold"
  },
  clientBlockWrap: {
    flexDirection: "row",
    justifyContent: "flex-end",
    width: "100%",
    marginTop: 0
  },
  clientBlock: {
    width: "100%",
    textAlign: "right",
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 24
  },
  siret: {
    fontWeight: "bold",
    fontSize: 10,
    marginTop: 2
  },
  // Date
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#dbeafe"

  },
  dateLabel: {
    backgroundColor: "#e5eafe",
    color: "#202060",
    padding: 6,
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
  // Table
  table: {
    width: "100%",
    marginTop: 10,
    marginBottom: 12
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 28,
    borderWidth: 1,
    borderColor: "#dbeafe"
  },
  tableHeader: {
    textAlign: "center",
    backgroundColor: "#e5eafe",
    fontWeight: "bold"
  },
  cellDesc: {
    flex: 3, padding: 6,
  },
  cellQty: {
    flex: 1, padding: 6, textAlign: "center",
  },
  cellPrice: {
    flex: 1.5, padding: 6, textAlign: "right",
  },
  cellTotalHT: {
    flex: 1.7, padding: 6, textAlign: "right",
  },
  cellTva: {
    flex: 1.2, padding: 6, textAlign: "right",
  },
  cellTotalTTC: {
    flex: 1.7, padding: 6, textAlign: "right"
  },
  // Totaux
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
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#c7d6fa",
    paddingVertical: 7,
    paddingHorizontal: 12
  },
  totalsRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  paiementBlock: {
    marginTop: 22,
    fontSize: 11,
    width: "80%"
  },
  note: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 10,
    color: "#6B7280"
  }
});

type InvoiceItem = {
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  vatRate: number;
  totalHT: number | string;
  totalTVA: number | string;
  totalTTC: number | string;
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
  invoiceTitle: string;
  issuedAt: string | Date;
  statut: string;
  issuer: CompanyInfo;
  legalNote?: string | null;
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
  totalHT: number | string;
  totalTVA: number | string;
  totalTTC: number | string;
  paymentInfo?: string | null;
};

export const InvoicePDF = ({
  invoiceTitle,
  issuedAt,
  issuer,
  client,
  items,
  totalHT,
  totalTVA,
  totalTTC,
  paymentInfo,
  legalNote // <-- AJOUT !
}: InvoicePDFProps) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* TITRE EN HAUT DROITE */}
        <View style={styles.titleRow}>
          <Text style={styles.invoiceTitle}>
            {invoiceTitle}
          </Text>
        </View>
        {/* INFOS EMETTEUR */}
        <View style={styles.headerBlock}>
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
              <Text style={styles.siret}>SIRET : {client.siret}</Text>
            )}
            {client.vat && (
              <Text style={styles.siret}>TVA : {client.vat}</Text>
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
            <Text style={styles.cellPrice}>Prix uni HT</Text>
            <Text style={styles.cellTotalHT}>Prix total HT</Text>
            <Text style={styles.cellTva}>TVA (%)</Text>
            <Text style={styles.cellTotalTTC}>Prix total TTC</Text>
          </View>
          {items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.cellDesc}>{item.description}</Text>
              <Text style={styles.cellQty}>{item.quantity}</Text>
              <Text style={styles.cellPrice}>{formatEuro(item.unitPrice)}</Text>
              <Text style={styles.cellTotalHT}>{formatEuro(item.totalHT)}</Text>
              <Text style={styles.cellTva}>{(item.vatRate || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</Text>
              <Text style={styles.cellTotalTTC}>{formatEuro(item.totalTTC)}</Text>
            </View>
          ))}
        </View>
        {/* PAIEMENT + TOTALS côte à côte */}
        <View style={{ flexDirection: "row", width: "100%", marginTop: 22 }}>
          <View style={{ width: "50%" }}>
            {paymentInfo && (
              <View style={styles.paiementBlock}>
                <Text>{paymentInfo}</Text>
              </View>
            )}
          </View>
          <View style={styles.totalsBox}>
            <View style={styles.totalsTable}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Total HT</Text>
                <Text style={styles.totalsValue}>{formatEuro(totalHT)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Total TVA :</Text>
                <Text style={styles.totalsValue}>{formatEuro(totalTVA)}</Text>
              </View>
              <View style={styles.totalsRowLast}>
                <Text style={styles.totalsLabel}>Total TTC</Text>
                <Text style={styles.totalsValue}>{formatEuro(totalTTC)}</Text>
              </View>
            </View>
          </View>
        </View>
        {/* MENTION LÉGALE EN BAS */}
        {legalNote && (
          <Text style={styles.note}>{legalNote}</Text>
        )}
      </Page>
    </Document>
  );
};

export default InvoicePDF;
