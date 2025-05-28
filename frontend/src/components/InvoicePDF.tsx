"use client";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Styles adaptés à ton design
const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    padding: 30,
    fontFamily: "Helvetica",
    backgroundColor: "#fff"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },
  column: {
    flexDirection: "column"
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 2
  },
  value: {
    marginBottom: 2
  },
  factureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
    marginBottom: 6
  },
  table: {
    width: "auto",
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0"
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
    minHeight: 20,
    alignItems: "center"
  },
  tableHeader: {
    backgroundColor: "#F3F6FC",
    fontWeight: "bold"
  },
  tableCell: {
    padding: 4,
    flexGrow: 1,
    textAlign: "left"
  },
  tableCellQty: {
    flexGrow: 0.4,
    textAlign: "center"
  },
  tableCellPrice: {
    flexGrow: 0.7,
    textAlign: "right"
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8
  },
  totalsCell: {
    width: 120,
    textAlign: "right"
  },
  note: {
    marginTop: 12,
    fontSize: 9,
    color: "#666",
    textAlign: "center"
  },
  paymentInfo: {
    marginTop: 10,
    fontSize: 10
  }
});

// Types pour les props
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
export interface InvoicePDFProps {
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
  };
  items: InvoiceItem[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  paymentInfo?: string | null;
  iban?: string | null;
  bic?: string | null;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({
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
}) => {
  // Calcul TVA(s) par taux
  const tvaMap: Record<string, number> = {};
  items.forEach((item) => {
    const taux = (item.vatRate || 0).toFixed(2);
    tvaMap[taux] = (tvaMap[taux] || 0) + item.totalTVA;
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          {/* Émetteur */}
          <View style={{ width: "45%" }}>
            <Text style={styles.sectionTitle}>Émetteur :</Text>
            <Text style={styles.value}>{issuer.name || "Votre société"}</Text>
            <Text style={styles.value}>{issuer.address || ""}</Text>
            <Text style={styles.value}>
              {[issuer.zip, issuer.city].filter(Boolean).join(" ")}
            </Text>
            {issuer.siret && (
              <Text style={styles.value}>SIRET : {issuer.siret}</Text>
            )}
            {issuer.vat && (
              <Text style={styles.value}>TVA : {issuer.vat}</Text>
            )}
          </View>
          {/* Facture numéro */}
          <View style={{ width: "30%" }}>
            <Text style={styles.factureTitle}>Facture N°{invoiceNumber}</Text>
          </View>
          {/* Client */}
          <View style={{ width: "25%" }}>
            <Text style={styles.sectionTitle}>Client :</Text>
            <Text style={styles.value}>{client.name}</Text>
            <Text style={styles.value}>{client.address}</Text>
            <Text style={styles.value}>
              {[client.zip, client.city].filter(Boolean).join(" ")}
            </Text>
            {client.vat && <Text style={styles.value}>TVA : {client.vat}</Text>}
            {client.email && (
              <Text style={styles.value}>Email : {client.email}</Text>
            )}
            {client.phone && (
              <Text style={styles.value}>Tél : {client.phone}</Text>
            )}
          </View>
        </View>

        {/* Infos Date + Statut */}
        <View style={{ flexDirection: "row", marginTop: 12, marginBottom: 6 }}>
          <Text style={{ flexGrow: 1 }}>
            Émise le :{" "}
            {typeof issuedAt === "string"
              ? new Date(issuedAt).toLocaleDateString("fr-FR")
              : issuedAt.toLocaleDateString("fr-FR")}
          </Text>
          <Text>Statut : {statut}</Text>
        </View>

        {/* TABLEAU */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Désignation</Text>
            <Text style={[styles.tableCell, styles.tableCellQty]}>Qté</Text>
            <Text style={[styles.tableCell, styles.tableCellPrice]}>
              PU HT
            </Text>
            <Text style={[styles.tableCell, styles.tableCellPrice]}>
              TVA
            </Text>
            <Text style={[styles.tableCell, styles.tableCellPrice]}>
              Total HT
            </Text>
            <Text style={[styles.tableCell, styles.tableCellPrice]}>
              Total TTC
            </Text>
          </View>
          {/* Table Rows */}
          {items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={styles.tableCell}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.tableCellQty]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellPrice]}>
                {item.unitPrice.toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellPrice]}>
                {(item.vatRate || 0).toFixed(2)} %
              </Text>
              <Text style={[styles.tableCell, styles.tableCellPrice]}>
                {item.totalHT.toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellPrice]}>
                {item.totalTTC.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* TOTALS */}
        <View style={styles.totalsRow}>
          <Text style={styles.totalsCell}>
            Total HT : {totalHT.toFixed(2)} €
          </Text>
        </View>
        {Object.entries(tvaMap).map(([taux, montant]) => (
          <View style={styles.totalsRow} key={taux}>
            <Text style={styles.totalsCell}>
              TVA {taux} % : {montant.toFixed(2)} €
            </Text>
          </View>
        ))}
        <View style={styles.totalsRow}>
          <Text style={styles.totalsCell}>
            Total TVA : {totalTVA.toFixed(2)} €
          </Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsCell}>
            Total TTC : {totalTTC.toFixed(2)} €
          </Text>
        </View>

        {/* Paiement / note */}
        {(paymentInfo || iban || bic) && (
          <View style={styles.paymentInfo}>
            <Text>Informations de paiement :</Text>
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
