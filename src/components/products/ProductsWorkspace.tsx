"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Product = { id: string; name: string; description: string; price: number; created_at: string };

function currency(value: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export function ProductsWorkspace() {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadProducts() {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/products", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Katalog gagal dimuat.");
      setProducts(result.products);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Katalog gagal dimuat.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadProducts(); }, []);

  function resetForm() { setEditing(null); setName(""); setDescription(""); setPrice(""); }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(null); setMessage(null);
    try {
      const response = await fetch(editing ? `/api/dashboard/products/${editing}` : "/api/dashboard/products", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, price }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Produk gagal disimpan.");
      if (editing) setProducts((current) => current.map((item) => item.id === editing ? result.product : item));
      else setProducts((current) => [...current, result.product].sort((a, b) => a.name.localeCompare(b.name)));
      resetForm(); setMessage("Produk tersimpan dan siap dipakai di invoice.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Produk gagal disimpan.");
    } finally { setSaving(false); }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Hapus ${product.name} dari katalog?`)) return;
    const response = await fetch(`/api/dashboard/products/${product.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Produk gagal dihapus."); return; }
    setProducts((current) => current.filter((item) => item.id !== product.id));
    setMessage("Produk dihapus dari katalog.");
  }

  return (
    <div className="space-y-6">
      <header><h1 className="text-xl font-bold tracking-tight sm:text-2xl">Katalog Produk</h1><p className="text-muted-foreground">Simpan produk dan jasa, lalu masukkan ke invoice tanpa mengetik ulang.</p></header>
      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">{message}</p>}
      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <h2 className="font-semibold">{editing ? "Ubah produk" : "Tambah produk atau jasa"}</h2>
        <form onSubmit={saveProduct} className="mt-4 grid gap-3 md:grid-cols-[1fr_1.2fr_180px_auto]">
          <input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama produk / jasa" className="h-10 rounded-lg border bg-background px-3 text-sm" />
          <input maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Deskripsi (opsional)" className="h-10 rounded-lg border bg-background px-3 text-sm" />
          <input required type="number" min="0" max="999999999999" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Harga (Rp)" className="h-10 rounded-lg border bg-background px-3 text-sm" />
          <div className="flex gap-2"><Button type="submit" disabled={saving}><Plus className="mr-2 h-4 w-4" />{saving ? "Menyimpan…" : editing ? "Perbarui" : "Tambah"}</Button><Button type="button" variant="outline" onClick={resetForm} disabled={saving}><RotateCcw className="mr-2 h-4 w-4" />Reset</Button></div>
        </form>
      </section>
      <section className="space-y-3 rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Produk tersimpan</h2><Link href="/dashboard/invoices/new" className="text-sm font-semibold text-primary hover:underline">Buat invoice</Link></div>
        {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Memuat katalog…</p> : products.length ? products.map((product) => <article key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div className="min-w-0"><p className="font-medium">{product.name}</p>{product.description && <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>}</div><div className="flex items-center gap-3"><span className="font-semibold tabular-nums">{currency(product.price)}</span><Button variant="ghost" size="icon" onClick={() => { setEditing(product.id); setName(product.name); setDescription(product.description); setPrice(String(product.price)); }} aria-label={`Edit ${product.name}`}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => void deleteProduct(product)} aria-label={`Hapus ${product.name}`}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></article>) : <p className="py-8 text-center text-sm text-muted-foreground">Katalog masih kosong. Tambahkan produk atau jasa pertamamu.</p>}
      </section>
    </div>
  );
}
