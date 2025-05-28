// frontend/src/components/QuotePDF.tsx

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

type QuoteItem = {
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

type QuotePDFProps = {
  quote: {
    number: string;
    issuedAt: string | Date;
    validUntil?: string | Date | null;
    statut: string;
    clientName: string;
    clientAddress: string;
    clientZip: string;
    clientCity: string;
    clientEmail?: string;
    clientPhone?: string;
    items: QuoteItem[];
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    notes?: string | null;
    user?: { companyInfo?: CompanyInfo | null } | null;
  };
};

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
  quoteTitle: {
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

export const QuotePDF: React.FC<QuotePDFProps> = ({ quote }) => {
  // Calcul TVA par taux
  const tvaMap: Record<string, number> = {};
  quote.items.forEach((item) => {
    const taux = (item.vatRate || 0).toFixed(2);
    tvaMap[taux] = (tvaMap[taux] || 0) + item.totalTVA;
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Émetteur :</Text>
            <Text style={styles.value}>{quote.user?.companyInfo?.name || "Votre société"}</Text>
            <Text style={styles.value}>{quote.user?.companyInfo?.address || ""}</Text>
            <Text style={styles.value}>
              {[quote.user?.companyInfo?.zip, quote.user?.companyInfo?.city].filter(Boolean).join(" ")}
            </Text>
            {quote.user?.companyInfo?.siret && (
              <Text style={styles.value}>SIRET : {quote.user.companyInfo.siret}</Text>
            )}
            {quote.user?.companyInfo?.vat && (
              <Text style={styles.value}>TVA : {quote.user.companyInfo.vat}</Text>
            )}
          </View>
          <View>
            <Text style={styles.quoteTitle}>Devis N°{quote.number}</Text>
            <Text style={styles.value}>
              Émis le : {new Date(quote.issuedAt).toLocaleDateString("fr-FR")}
            </Text>
            {quote.validUntil && (
              <Text style={styles.value}>
                Valable jusqu'au : {new Date(quote.validUntil).toLocaleDateString("fr-FR")}
              </Text>
            )}
            <Text style={styles.value}>Statut : {quote.statut}</Text>
          </View>
        </View>

        {/* CLIENT */}
        <View style={[styles.column, { marginTop: 18, marginBottom: 8 }]}>
          <Text style={styles.sectionTitle}>Client :</Text>
          <Text style={styles.value}>{quote.clientName}</Text>
          <Text style={styles.value}>{quote.clientAddress}</Text>
          <Text style={styles.value}>
            {[quote.clientZip, quote.clientCity].filter(Boolean).join(" ")}
          </Text>
          {quote.clientEmail && <Text style={styles.value}>Email : {quote.clientEmail}</Text>}
          {quote.clientPhone && <Text style={styles.value}>Tél : {quote.clientPhone}</Text>}
        </View>

        {/* TABLEAU LIGNES */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { flexGrow: 2 }]}>Désignation</Text>
            <Text style={[styles.tableCell, styles.tableCellQty]}>Qté</Text>
            <Text style={[styles.tableCell, styles.tableCellPrice]}>PU HT</Text>
            <Text style={[styles.tableCell, styles.tableCellPrice]}>TVA</Text>
            <Text style={[styles.tableCell, styles.tableCellPrice]}>Total HT</Text>
            <Text style={[styles.tableCell, styles.tableCellPrice]}>Total TTC</Text>
          </View>
          {quote.items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flexGrow: 2 }]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.tableCellQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.tableCellPrice]}>{item.unitPrice.toFixed(2)} €</Text>
              <Text style={[styles.tableCell, styles.tableCellPrice]}>
                {(item.vatRate || 0).toFixed(2)} %
              </Text>
              <Text style={[styles.tableCell, styles.tableCellPrice]}>{item.totalHT.toFixed(2)} €</Text>
              <Text style={[styles.tableCell, styles.tableCellPrice]}>{item.totalTTC.toFixed(2)} €</Text>
            </View>
          ))}
        </View>

        {/* TOTAUX */}
        <View style={styles.totalsRow}>
          <Text style={styles.totalsCell}>Total HT :</Text>
          <Text style={styles.totalsCell}>{quote.totalHT.toFixed(2)} €</Text>
        </View>
        {/* Affichage TVA(s) par taux */}
        {Object.entries(tvaMap).map(([taux, montant]) => (
          <View style={styles.totalsRow} key={taux}>
            <Text style={styles.totalsCell}>TVA {taux} % :</Text>
            <Text style={styles.totalsCell}>{montant.toFixed(2)} €</Text>
          </View>
        ))}
        <View style={styles.totalsRow}>
          <Text style={styles.totalsCell}>Total TVA :</Text>
          <Text style={styles.totalsCell}>{quote.totalTVA.toFixed(2)} €</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsCell}>Total TTC :</Text>
          <Text style={styles.totalsCell}>{quote.totalTTC.toFixed(2)} €</Text>
        </View>

        {/* NOTES */}
        {quote.notes && (
          <Text style={styles.note}>Conditions / Notes : {quote.notes}</Text>
        )}

        {/* TVA non applicable */}
        <Text style={styles.note}>TVA non applicable, art. 293B du CGI.</Text>
      </Page>
    </Document>
  );
};

export default QuotePDF;
