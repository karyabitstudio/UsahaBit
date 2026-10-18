"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type InvoiceRow = {
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  client_name: string;
};

type ClientRow = {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
};

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const content = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ReportsPanel({ invoices, clients }: { invoices: InvoiceRow[]; clients: ClientRow[] }) {
  const paidTotal = invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const unpaidTotal = invoices.filter((invoice) => invoice.status !== "paid" && invoice.status !== "cancelled").reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const formatCurrency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Laporan & Export Data</h1>
        <p className="text-muted-foreground">Ringkasan tagihan dan unduh data bisnis dalam format CSV.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total invoice" value={String(invoices.length)} />
        <SummaryCard label="Invoice lunas" value={formatCurrency(paidTotal)} />
        <SummaryCard label="Belum lunas" value={formatCurrency(unpaidTotal)} />
      </div>
      <section className="rounded-xl border bg-card p-5 sm:p-6">
        <h2 className="font-semibold">Export data</h2>
        <p className="mt-1 text-sm text-muted-foreground">Unduh salinan data agar mudah diolah di spreadsheet.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => downloadCsv("usahabit-invoice.csv", ["Nomor Invoice", "Klien", "Tanggal", "Jatuh Tempo", "Status", "Subtotal", "Pajak", "Total"], invoices.map((invoice) => [invoice.invoice_number, invoice.client_name, invoice.issue_date, invoice.due_date, invoice.status, invoice.subtotal, invoice.tax, invoice.total]))}>
            <Download className="mr-2 h-4 w-4" /> Export invoice
          </Button>
          <Button variant="outline" onClick={() => downloadCsv("usahabit-klien.csv", ["Nama", "Email", "Telepon", "Alamat"], clients.map((client) => [client.name, client.email, client.phone, client.address]))}>
            <Download className="mr-2 h-4 w-4" /> Export klien
          </Button>
        </div>
      </section>
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-5"><h2 className="font-semibold">Ringkasan invoice</h2></div>
        {invoices.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Nomor</th><th className="px-5 py-3 font-medium">Klien</th><th className="px-5 py-3 font-medium">Tanggal</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Total</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.invoice_number} className="border-t"><td className="px-5 py-3 font-medium">{invoice.invoice_number}</td><td className="px-5 py-3">{invoice.client_name || "-"}</td><td className="px-5 py-3">{invoice.issue_date}</td><td className="px-5 py-3 capitalize">{invoice.status}</td><td className="px-5 py-3 text-right">{formatCurrency(Number(invoice.total || 0))}</td></tr>)}</tbody></table></div> : <p className="p-5 text-sm text-muted-foreground">Belum ada invoice untuk ditampilkan.</p>}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>;
}
