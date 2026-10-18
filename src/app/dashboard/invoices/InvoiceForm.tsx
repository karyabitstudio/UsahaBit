"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Lock, Plus, Trash2 } from "lucide-react";

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface InvoiceFormProps {
  initialData?: any;
  clients: { id: string; name: string }[];
  workspaceId: string;
  products?: { id: string; name: string; description: string; price: number }[];
  canUseAllTemplates?: boolean;
}

export function InvoiceForm({ initialData, clients, workspaceId, products = [], canUseAllTemplates = false }: InvoiceFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!initialData;

  const [clientId, setClientId] = useState(initialData?.client_id || "");
  const [issueDate, setIssueDate] = useState(
    initialData?.issue_date || new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState(initialData?.due_date || "");
  const [status, setStatus] = useState(initialData?.status || "draft");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [template, setTemplate] = useState(initialData?.template || "classic");
  const [catalogProductId, setCatalogProductId] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>(
    initialData?.invoice_items?.length
      ? initialData.invoice_items.map((i: any) => ({
          description: i.description,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
        }))
      : [{ description: "", quantity: 1, unit_price: 0 }],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );
  const tax = 0; // bisa ditambah PPN nanti
  const total = subtotal + tax;
  const invoiceTemplates = [
    { id: "classic", name: "Classic", description: "Tampilan bersih dan profesional." },
    { id: "modern", name: "Modern", description: "Header berwarna dengan kesan tegas." },
    { id: "minimal", name: "Minimal", description: "Sederhana dengan garis dan ruang lega." },
  ] as const;

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const generateInvoiceNumber = async (userId: string) => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const sequence = String((count || 0) + 1).padStart(4, "0");
    return `INV-${year}-${sequence}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sesi login berakhir. Silakan masuk kembali.");
      setLoading(false);
      return;
    }

    try {
      let invoiceId = initialData?.id;
      let invoiceNumber = initialData?.invoice_number;

      if (!isEdit) {
        const limitResponse = await fetch("/api/check-invoice-limit", { cache: "no-store" });
        if (!limitResponse.ok) throw new Error("Gagal memeriksa batas invoice. Coba lagi.");
        const limit = await limitResponse.json();
        if (!limit.allowed) {
          throw new Error("Batas invoice gratis bulan ini sudah habis. Pilih paket untuk melanjutkan.");
        }

        invoiceNumber = await generateInvoiceNumber(workspaceId);

        const { data: newInvoice, error: invError } = await supabase
          .from("invoices")
          .insert({
            user_id: workspaceId,
            client_id: clientId || null,
            invoice_number: invoiceNumber,
            issue_date: issueDate,
            due_date: dueDate || null,
            status,
            subtotal,
            tax,
            total,
            notes: notes || null,
            template: canUseAllTemplates ? template : "classic",
          })
          .select()
          .single();

        if (invError) throw invError;
        invoiceId = newInvoice.id;
      } else {
        const { error: updateError } = await supabase
          .from("invoices")
          .update({
            client_id: clientId || null,
            issue_date: issueDate,
            due_date: dueDate || null,
            status,
            subtotal,
            tax,
            total,
            notes: notes || null,
            template: canUseAllTemplates ? template : "classic",
          })
          .eq("id", invoiceId)
          .eq("user_id", workspaceId);

        if (updateError) throw updateError;

        // Hapus item lama
        await supabase
          .from("invoice_items")
          .delete()
          .eq("invoice_id", invoiceId);
      }

      // Insert items
      const itemsPayload = items
        .filter((item) => item.description.trim())
        .map((item) => ({
          invoice_id: invoiceId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.quantity * item.unit_price,
        }));

      if (itemsPayload.length > 0) {
        const { error: itemsError } = await supabase
          .from("invoice_items")
          .insert(itemsPayload);
        if (itemsError) throw itemsError;
      }

      router.push("/dashboard/invoices");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Info Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Client</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Terkirim</SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
              <SelectItem value="overdue">Terlambat</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tanggal Invoice</Label>
          <Input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Jatuh Tempo</Label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      {/* Items */}
      {products.length > 0 && <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-end"><div className="flex-1 space-y-2"><Label htmlFor="catalogProduct">Tambah dari katalog</Label><Select value={catalogProductId} onValueChange={(value) => setCatalogProductId(value ?? "")}><SelectTrigger id="catalogProduct"><SelectValue placeholder="Pilih produk atau jasa" /></SelectTrigger><SelectContent>{products.map((product) => <SelectItem key={product.id} value={product.id}>{product.name} · Rp {new Intl.NumberFormat("id-ID").format(Number(product.price))}</SelectItem>)}</SelectContent></Select></div><Button type="button" variant="outline" disabled={!catalogProductId} onClick={() => { const product = products.find((item) => item.id === catalogProductId); if (product) { setItems((current) => [...current, { description: product.name, quantity: 1, unit_price: Number(product.price) }]); setCatalogProductId(""); } }}><Plus className="mr-2 h-4 w-4" />Tambah item</Button></div>}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Item / Jasa</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" /> Tambah Item
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-2 items-end gap-3 md:grid-cols-12">
              <div className="col-span-2 space-y-1 md:col-span-5">
                <Label className="text-xs">Deskripsi</Label>
                <Input
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, "description", e.target.value)
                  }
                  placeholder="Nama barang / jasa"
                  required
                />
              </div>
              <div className="col-span-1 space-y-1 md:col-span-2">
                <Label className="text-xs">Qty</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", Number(e.target.value))
                  }
                />
              </div>
              <div className="col-span-1 space-y-1 md:col-span-3">
                <Label className="text-xs">Harga Satuan</Label>
                <Input
                  type="number"
                  min="0"
                  value={item.unit_price}
                  onChange={(e) =>
                    updateItem(index, "unit_price", Number(e.target.value))
                  }
                />
              </div>
              <div className="col-span-1 space-y-1 md:col-span-1">
                <Label className="text-xs">Total</Label>
                <div className="h-10 flex items-center text-sm font-medium">
                  {new Intl.NumberFormat("id-ID").format(
                    item.quantity * item.unit_price,
                  )}
                </div>
              </div>
              <div className="col-span-1 flex justify-end md:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total & Notes */}
      <div className="space-y-2">
        <Label htmlFor="invoiceTemplate">Template invoice</Label>
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Pilih template invoice">
          {invoiceTemplates.map((item) => {
            const locked = item.id !== "classic" && !canUseAllTemplates;
            const selected = (canUseAllTemplates ? template : "classic") === item.id;
            return <button key={item.id} type="button" role="radio" aria-checked={selected} aria-disabled={locked} onClick={() => { if (!locked) setTemplate(item.id); }} className={`rounded-xl border p-3 text-left transition ${selected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"} ${locked ? "cursor-not-allowed opacity-75" : ""}`}>
              <div className="mb-3 flex aspect-[1.45/1] items-center justify-center rounded-lg bg-muted p-3">
                <div className={`h-full w-[62%] overflow-hidden rounded border bg-white p-2 shadow-sm ${item.id === "modern" ? "border-slate-800" : "border-slate-200"}`}>
                  <div className={`mb-2 flex h-5 items-center justify-between px-1 ${item.id === "modern" ? "bg-slate-800" : item.id === "minimal" ? "border-b border-slate-300" : "bg-blue-600"}`}><span className={`h-1 w-8 rounded ${item.id === "minimal" ? "bg-slate-800" : "bg-white"}`} /><span className={`h-1 w-4 rounded ${item.id === "minimal" ? "bg-slate-400" : "bg-white/70"}`} /></div>
                  <div className="mb-2 h-1 w-9 rounded bg-slate-700" /><div className="space-y-1"><div className="h-1 rounded bg-slate-200" /><div className="h-1 w-4/5 rounded bg-slate-200" /><div className="mt-2 h-4 rounded-sm bg-slate-100" /></div>
                  <div className="ml-auto mt-2 h-1 w-6 rounded bg-blue-500" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{item.name}</span>{locked ? <Lock className="h-4 w-4 text-muted-foreground" /> : selected ? <Check className="h-4 w-4 text-primary" /> : null}</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}{locked ? " · Pro/Business" : ""}</p>
            </button>;
          })}
        </div>
        {!canUseAllTemplates && <p className="text-xs text-muted-foreground">Template Modern dan Minimal tersedia di Pro dan Business. <a href="/pricing" className="font-semibold text-primary hover:underline">Lihat paket</a></p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Catatan</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan tambahan untuk client..."
            rows={4}
          />
        </div>

        <div className="space-y-2 rounded-lg bg-muted p-4 sm:p-6">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Pajak</span>
            <span>
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(tax)}
            </span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(total)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Menyimpan..."
            : isEdit
              ? "Update Invoice"
              : "Simpan Invoice"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
      </div>
    </form>
  );
}
