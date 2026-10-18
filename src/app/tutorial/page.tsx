import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Database,
  FileText,
  History,
  MessageCircle,
  Package,
  Printer,
  ShieldQuestion,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { buttonVariants } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Pilih layanan",
    description: "Klik Coba semua layanan untuk membuka ruang demo. Pilih alat di menu samping: buat invoice, kelola klien, coba katalog produk, susun surat, atur profil usaha, cek riwayat, atau siapkan pesan WhatsApp. Demo bisa dicoba tanpa membuat akun.",
  },
  {
    number: "02",
    icon: BriefcaseBusiness,
    title: "Siapkan profil usaha",
    description: "Masukkan nama usaha, nomor WhatsApp, alamat, dan warna identitas. Periksa kembali ejaan serta nomor kontak karena informasi ini akan membantu pelanggan mengenali usaha dan menghubungimu.",
  },
  {
    number: "03",
    icon: Users,
    title: "Kelola data pelanggan dan produk",
    description: "Di menu Klien, simpan nama serta email atau nomor WhatsApp pelanggan. Di Katalog Produk, tulis nama produk/jasa, deskripsi, dan harga. Data katalog dapat dipilih kembali saat menyusun invoice sehingga kamu tidak perlu mengetik ulang.",
  },
  {
    number: "04",
    icon: CheckCircle2,
    title: "Buat invoice lengkap",
    description: "Isi identitas usaha dan pelanggan, tanggal invoice serta jatuh tempo. Tambahkan satu atau beberapa item, atur jumlah dan harga satuan, periksa subtotal dan pajak, lalu tulis catatan pembayaran bila diperlukan. Pastikan total dan data penerima sudah benar sebelum membuat invoice.",
  },
  {
    number: "05",
    icon: Printer,
    title: "Pratinjau dan simpan PDF",
    description: "Periksa tampilan invoice, nama pelanggan, rincian barang, total, serta tanggal. Pilih Simpan sebagai PDF pada jendela cetak browser, lalu pilih folder penyimpanan. File PDF tersimpan di perangkatmu; simpan salinannya di tempat yang mudah ditemukan.",
  },
  {
    number: "06",
    icon: MessageCircle,
    title: "Kirim dan pantau tagihan",
    description: "Gunakan tombol WhatsApp untuk membuka aplikasi dengan pesan tagihan yang sudah disiapkan, lalu periksa dan kirim pesannya. Buka Riwayat untuk melihat invoice demo dan memperbarui status pembayaran menjadi lunas jika sudah diterima.",
  },
];

const services = [
  { icon: Users, title: "Klien", text: "Simpan nama dan kontak pelanggan agar lebih mudah dipakai saat membuat dokumen." },
  { icon: Package, title: "Produk", text: "Catat nama, keterangan, dan harga produk atau jasa untuk dipilih ketika membuat invoice." },
  { icon: FileText, title: "Surat usaha", text: "Isi penerima, judul, dan isi surat penawaran, SPK, atau kwitansi, lalu cetak atau simpan sebagai PDF." },
  { icon: History, title: "Riwayat", text: "Lihat invoice yang dibuat dari demo di browser ini dan tandai status pembayarannya." },
];

const invoiceDetails = [
  { title: "1. Isi data usaha dan pelanggan", text: "Tuliskan nama usaha dan nama pelanggan. Email serta nomor WhatsApp membantu memudahkan pengiriman, tetapi isi hanya jika datanya tersedia." },
  { title: "2. Tambahkan rincian tagihan", text: "Untuk setiap item, masukkan nama barang atau pekerjaan, jumlah, dan harga satuan. Tambahkan baris jika invoice berisi lebih dari satu item. Total dihitung otomatis." },
  { title: "3. Atur tanggal dan catatan", text: "Tanggal terbit biasanya tanggal invoice dibuat. Isi tanggal jatuh tempo jika ada batas pembayaran. Gunakan catatan untuk instruksi transfer atau ketentuan singkat." },
  { title: "4. Buat, periksa, lalu unduh", text: "Klik Buat invoice, baca pratinjau dari atas sampai bawah, lalu pilih cetak/simpan PDF. Di dialog cetak browser, pilih Simpan sebagai PDF sebagai tujuan." },
];

const faq = [
  { question: "Apakah saya perlu membuat akun untuk mencoba?", answer: "Tidak untuk layanan demo. Klik Coba semua layanan dari halaman utama. Akun diperlukan untuk memakai dashboard dan menyimpan data akun ke database." },
  { question: "Data demo tersimpan di mana?", answer: "Data percobaan disimpan di penyimpanan browser pada perangkat yang sedang dipakai. Data ini tidak otomatis tersinkron ke perangkat lain atau ke database. Menghapus data browser dapat menghilangkan data demo." },
  { question: "Berapa batas gratisnya?", answer: "Demo menyediakan sampai tiga penggunaan gratis per layanan per bulan pada browser ini, dan invoice demo memiliki hitungan tersendiri sampai tiga per bulan. Batas dashboard mengikuti paket akun yang sedang aktif." },
  { question: "Bagaimana data disimpan permanen?", answer: "Masuk atau daftar, lalu gunakan dashboard. Data yang dibuat di dashboard disimpan pada akunmu. Data dari demo browser tidak dipindahkan otomatis, jadi masukkan kembali data yang ingin dipakai." },
  { question: "Bagaimana jika jatah gratis habis?", answer: "Halaman layanan akan memberi tahu saat batasnya tercapai dan menyediakan tautan untuk melihat paket. Periksa fitur dan harga paket di halaman Harga sebelum memilih." },
];

export default function TutorialPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 sm:py-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" aria-label="UsahaBit - Beranda"><BrandLogo size={42} /></Link>
        <Link href="/coba/layanan" className="text-sm font-medium text-primary hover:underline">Buka layanan <ArrowRight className="ml-1 inline h-4 w-4" /></Link>
      </header>

      <section className="mx-auto max-w-6xl">
        <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Beranda</Link>
        <div className="mx-auto mt-10 max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-primary">Panduan UsahaBit</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Mulai dari layanan yang kamu butuhkan</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">Panduan dari mencoba layanan sampai membuat invoice, menyimpan dokumen, dan memahami batas serta penyimpanan data.</p>
          <Link href="/coba/layanan" className={buttonVariants({ size: "lg", className: "mt-7 rounded-full px-7" })}>Coba semua layanan <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {steps.map((step) => <article key={step.number} className="rounded-2xl border border-border bg-card p-5 sm:p-6"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><step.icon className="h-5 w-5" /></div><div><div className="flex items-center gap-2"><span className="text-xs font-semibold tracking-widest text-primary">LANGKAH {step.number}</span></div><h2 className="mt-2 text-lg font-semibold">{step.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p></div></div></article>)}
        </div>

        <section className="mt-14 rounded-3xl border border-border bg-card p-6 sm:p-9">
          <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[.14em] text-primary">Panduan lebih rinci</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Membuat invoice dari awal sampai PDF</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Ikuti urutan ini supaya informasi tagihan mudah dibaca dan tidak ada rincian penting yang tertinggal.</p></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">{invoiceDetails.map((item) => <article key={item.title} className="rounded-2xl border border-border bg-background p-5"><h3 className="font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p></article>)}</div>
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-primary/5 p-4 text-sm leading-6"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary"/><p><strong>Tips:</strong> gunakan satu mata uang secara konsisten, cek kembali angka total, dan jangan mengirim PDF sebelum nama serta kontak pelanggan benar.</p></div>
        </section>

        <section className="mt-14 rounded-3xl border border-border bg-muted/30 p-6 sm:p-9">
          <div className="max-w-2xl"><h2 className="text-xl font-bold sm:text-2xl">Kenali layanan lainnya</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Gunakan layanan sesuai kebutuhan. Tiap layanan demo memiliki alur dan hitungan gratisnya sendiri.</p></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{services.map((service) => <div key={service.title} className="rounded-xl border border-border bg-card p-4"><service.icon className="h-5 w-5 text-primary"/><h3 className="mt-3 text-sm font-semibold">{service.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{service.text}</p></div>)}</div>
        </section>

        <section className="mt-14 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-border bg-card p-6 sm:p-8"><Database className="h-6 w-6 text-primary"/><h2 className="mt-3 text-xl font-bold">Demo dan dashboard menyimpan data berbeda</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Demo tanpa akun menyimpan data di browser ini saja. Kalau memakai komputer atau browser lain, data demo tidak ikut terbawa. Untuk menyimpan data ke database, masuk atau daftar lalu buat data dari dashboard. Data demo tidak otomatis disalin ke dashboard.</p><div className="mt-5 flex flex-wrap gap-3"><Link href="/login" className={buttonVariants({ variant: "outline" })}>Masuk</Link><Link href="/register" className={buttonVariants()}>Daftar akun</Link></div></article>
          <article className="rounded-3xl border border-border bg-card p-6 sm:p-8"><ShieldQuestion className="h-6 w-6 text-primary"/><h2 className="mt-3 text-xl font-bold">Batas penggunaan gratis</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Pada demo browser, invoice memiliki jatah tiga pembuatan per bulan. Layanan klien, produk, surat, profil usaha, riwayat, dan WhatsApp masing-masing memiliki penghitung terpisah. Di dashboard, batas mengikuti paket akun. Saat jatah berakhir, buka halaman Harga untuk melihat pilihan paket.</p><Link href="/pricing" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Lihat harga paket <ArrowRight className="h-4 w-4"/></Link></article>
        </section>

        <section className="mt-14 rounded-3xl border border-border bg-card p-6 sm:p-9">
          <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[.14em] text-primary">Setelah masuk</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Gunakan dashboard untuk mengelola usaha</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Data yang dibuat di dashboard tersimpan di akunmu dalam database. Menu yang terlihat menyesuaikan paket aktif.</p></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-2xl border border-border bg-background p-5"><FileText className="h-5 w-5 text-primary"/><h3 className="mt-3 font-semibold">Invoice dan klien</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Buat invoice, simpan daftar klien, perbarui status tagihan, dan buka kembali invoice yang sudah dibuat.</p></article>
            <article className="rounded-2xl border border-border bg-background p-5"><Printer className="h-5 w-5 text-primary"/><h3 className="mt-3 font-semibold">Surat usaha</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Buat dokumen usaha dari template yang tersedia, lalu cetak atau simpan menjadi PDF.</p></article>
            <article className="rounded-2xl border border-border bg-background p-5"><Package className="h-5 w-5 text-primary"/><h3 className="mt-3 font-semibold">Katalog Pro dan Business</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Simpan produk atau jasa di menu Produk. Saat membuat invoice, pilih item katalog untuk mengisi deskripsi dan harga secara cepat.</p></article>
            <article className="rounded-2xl border border-border bg-background p-5"><FileText className="h-5 w-5 text-primary"/><h3 className="mt-3 font-semibold">Pengingat jatuh tempo</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Dashboard menampilkan invoice terkirim beserta penanda apakah tagihan terlambat, segera jatuh tempo, atau masih memiliki waktu pembayaran. Pilih invoice untuk membuka rincian dan menindaklanjuti tagihan.</p></article>
            <article className="rounded-2xl border border-border bg-background p-5"><MessageCircle className="h-5 w-5 text-primary"/><h3 className="mt-3 font-semibold">Support melalui tiket</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Kirim pertanyaan dari menu Support dan cek balasan di riwayat tiket. Tiket Pro dan Business diurutkan lebih dulu di inbox admin.</p></article>
            <article className="rounded-2xl border border-border bg-background p-5"><History className="h-5 w-5 text-primary"/><h3 className="mt-3 font-semibold">Laporan dan paket</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Lihat laporan yang tersedia sesuai paket. Masa aktif paket berakhir sesuai tanggal yang tercatat; fitur paket berbayar memerlukan paket aktif.</p></article>
          </div>
        </section>

        <section className="mt-14"><div className="mx-auto max-w-2xl text-center"><p className="text-sm font-semibold uppercase tracking-[.14em] text-primary">Pertanyaan umum</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Masih bingung?</h2></div><div className="mx-auto mt-7 max-w-3xl divide-y divide-border rounded-2xl border border-border bg-card px-5">{faq.map((item) => <article key={item.question} className="py-5"><h3 className="font-semibold">{item.question}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p></article>)}</div></section>

        <div className="mb-8 mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center sm:flex-row sm:text-left"><div><h2 className="font-semibold">Siap mencoba?</h2><p className="mt-1 text-sm text-muted-foreground">Mulai dari demo, atau masuk untuk memakai dashboard akun.</p></div><Link href="/coba/layanan" className={buttonVariants({ size: "lg", className: "rounded-full px-6" })}>Buka layanan <ArrowRight className="ml-2 h-4 w-4"/></Link></div>
      </section>
      <div className="mx-auto mt-10 max-w-6xl"><SiteFooter /></div>
    </main>
  );
}
