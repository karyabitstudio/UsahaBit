import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

interface InvoiceDocumentProps {
  invoice: any;
  profile: any;
  client: any;
  items: any[];
}

export function InvoiceDocument({
  invoice,
  profile,
  client,
  items,
}: InvoiceDocumentProps) {
  const brandColor = profile?.brand_color || "#2563eb";

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 11,
      fontFamily: "Helvetica",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 30,
      alignItems: "flex-start",
    },
    logo: {
      width: 70,
      height: 70,
      objectFit: "contain",
      marginBottom: 8,
    },
    businessName: {
      fontSize: 18,
      fontWeight: "bold",
      color: brandColor,
    },
    subtitle: {
      fontSize: 10,
      color: "#6b7280",
      marginTop: 2,
    },
    invoiceTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: brandColor,
      textAlign: "right",
    },
    invoiceNumber: {
      fontSize: 11,
      color: "#6b7280",
      textAlign: "right",
      marginTop: 4,
    },
    section: {
      marginBottom: 20,
    },
    label: {
      fontSize: 9,
      color: "#6b7280",
      marginBottom: 2,
      textTransform: "uppercase",
    },
    value: {
      fontSize: 11,
    },
    table: {
      marginTop: 20,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: brandColor,
      paddingVertical: 8,
      paddingHorizontal: 6,
    },
    tableHeaderText: {
      color: "#ffffff",
      fontSize: 10,
      fontWeight: "bold",
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#e5e7eb",
      paddingVertical: 8,
      paddingHorizontal: 6,
    },
    colDesc: { width: "45%" },
    colQty: { width: "15%", textAlign: "right" },
    colPrice: { width: "20%", textAlign: "right" },
    colAmount: { width: "20%", textAlign: "right" },
    totals: {
      marginTop: 20,
      alignItems: "flex-end",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 4,
      width: 220,
    },
    totalLabel: {
      width: 100,
      textAlign: "right",
      marginRight: 12,
      color: "#6b7280",
    },
    totalValue: { width: 100, textAlign: "right" },
    grandTotal: {
      fontSize: 14,
      fontWeight: "bold",
      marginTop: 6,
      color: brandColor,
    },
    notes: {
      marginTop: 40,
      padding: 12,
      backgroundColor: "#f9fafb",
      borderRadius: 4,
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      textAlign: "center",
      fontSize: 9,
      color: "#9ca3af",
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value || 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {profile?.logo_url ? (
              <Image src={profile.logo_url} style={styles.logo} />
            ) : null}
            <Text style={styles.businessName}>
              {profile?.business_name || "UsahaBit"}
            </Text>
            {profile?.full_name && (
              <Text style={styles.subtitle}>{profile.full_name}</Text>
            )}
            {profile?.phone && (
              <Text style={styles.subtitle}>{profile.phone}</Text>
            )}
          </View>

          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* Info Client & Tanggal */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View style={styles.section}>
            <Text style={styles.label}>Ditagihkan Kepada</Text>
            <Text style={styles.value}>{client?.name || "-"}</Text>
            {client?.address && (
              <Text style={styles.subtitle}>{client.address}</Text>
            )}
            {client?.email && (
              <Text style={styles.subtitle}>{client.email}</Text>
            )}
            {client?.phone && (
              <Text style={styles.subtitle}>{client.phone}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tanggal Invoice</Text>
            <Text style={styles.value}>{invoice.issue_date}</Text>

            {invoice.due_date && (
              <>
                <Text style={[styles.label, { marginTop: 10 }]}>
                  Jatuh Tempo
                </Text>
                <Text style={styles.value}>{invoice.due_date}</Text>
              </>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, styles.tableHeaderText]}>
              Deskripsi
            </Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>Qty</Text>
            <Text style={[styles.colPrice, styles.tableHeaderText]}>Harga</Text>
            <Text style={[styles.colAmount, styles.tableHeaderText]}>
              Jumlah
            </Text>
          </View>

          {(items || []).map((item: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>
                {formatCurrency(item.unit_price)}
              </Text>
              <Text style={styles.colAmount}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.subtotal)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Pajak</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.tax)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.total)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.label}>Catatan</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Terima kasih atas kepercayaan Anda • Dibuat dengan UsahaBit
        </Text>
      </Page>
    </Document>
  );
}
