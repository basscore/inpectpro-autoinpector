# PRD — InpectPro (Web App Inspeksi Otomotif untuk Inspektor)

**Versi:** 0.5 (draft — revisi role & distribusi laporan)
**Tanggal:** 2026-05-27
**Pemilik produk:** Arya
**Nama brand (final):** InpectPro
**Status:** Draft — revisi berdasarkan catatan

---

## 1. Ringkasan Singkat

InpectPro adalah **web app internal** yang dipakai tim inspektor mobil untuk mencatat, mendokumentasikan, dan menyusun laporan inspeksi langsung di lapangan lewat HP/tablet. Hasil akhirnya berupa **laporan PDF** yang dikirim ke klien yang memesan jasa inspeksi.

**Bukan** platform pemesanan untuk end-consumer. Ini **tool kerja** untuk inspektor.

**Tujuan utama:**
- Mempercepat pengisian laporan di lapangan (gak perlu catat manual lalu input ulang).
- Standarisasi format laporan antar inspektor.
- Hasil rapi & profesional saat sampai ke klien.

---

## 2. Masalah yang Diselesaikan

- Inspektor sekarang catat manual di kertas / Excel, lalu input ulang ke Word → lambat & rawan salah.
- Foto-foto tercecer di galeri HP, susah disusun jadi laporan.
- Format laporan beda-beda antar inspektor → kualitas tidak konsisten.
- Klien menunggu lama (kadang sampai berhari-hari) untuk terima laporan.

---

## 3. Pengguna

| Peran | Deskripsi | Aktivitas utama |
|---|---|---|
| **Super Admin** | Pemilik sistem, punya akses penuh | Kelola semua data, buat akun inspektor, buat & assign order, review laporan, kelola template inspeksi, export PDF, konfigurasi sistem |
| **Inspektor** | Yang turun ke lapangan, cek mobil langsung | Ambil order → isi checklist → foto/video → submit laporan |
| **Klien** *(bukan user app)* | Penerima laporan | Terima file PDF hasil export dari Super Admin — **tidak login ke app, tidak ada akses web** |

**Default Super Admin:**
- Username: `arya`
- Password: `macbookPro13`

> ⚠️ Password default wajib diganti setelah login pertama.

---

## 4. Prinsip Desain

1. **Mobile-first.** Semua tampilan dioptimalkan untuk HP. Inspektor pegang HP sambil cek mobil — jangan sampai ribet.
2. **Foto = warga kelas satu.** Ambil foto langsung dari kamera HP, otomatis terhubung ke titik pemeriksaan yang relevan.
3. **Bisa offline.** Sinyal di parkiran/basement sering jelek. Data harus bisa disimpan lokal dulu, lalu sinkronisasi saat sinyal kembali.
4. **Sedikit ketikan.** Sebanyak mungkin pakai checklist, tombol, rating bintang, dropdown — bukan ngetik panjang.
5. **Cepat.** Target: 1 inspeksi standar selesai diisi < 45 menit di lapangan.

---

## 5. Fitur Utama (Scope MVP)

### 5.1 Untuk Inspektor (mode lapangan, HP-first)

1. **Login** sederhana — username + password (tanpa autentikasi eksternal/OTP). Akun dibuat oleh Super Admin.
2. **Daftar order** yang ditugaskan ke dia (hari ini, minggu ini).
3. **Mulai inspeksi** — buka order, isi data awal mobil:
   - Merk, model, tipe, tahun.
   - Plat nomor, no rangka, no mesin.
   - KM odometer (foto wajib).
   - Warna, transmisi, bahan bakar.
4. **Checklist berkategori** — menggunakan template yang sudah dikonfigurasi Super Admin, dengan status: ✅ OK / ⚠️ Perhatian / ❌ Bermasalah / N/A
   - Kategori & item inspeksi sepenuhnya **dinamis** — ditentukan oleh template yang dipilih saat buat order.
   - Contoh kategori default: Eksterior, Interior, Mesin, Kaki-kaki, Kolong, Test Drive, Dokumen.
5. **Per titik bisa:**
   - Tambah foto (1 atau lebih) langsung dari kamera.
   - Tambah catatan (suara/teks singkat).
   - Tandai severity (ringan/sedang/berat).
6. **Auto-save & mode offline:**
   - Setiap perubahan otomatis disimpan ke **IndexedDB** (lokal) sebagai fallback.
   - Saat koneksi tersedia, data otomatis di-sync ke **Supabase** secara berkala.
   - Jika koneksi terputus di tengah inspeksi, inspektor **tetap bisa melanjutkan** — data lokal aman.
   - Saat koneksi kembali, sinkronisasi otomatis berjalan di background.
   - Inspeksi yang belum selesai bisa **dilanjutkan kapan saja** (dari device mana saja setelah sync) — tidak perlu mengulang dari awal.
7. **Submit laporan** → status berubah jadi "Menunggu Review".

### 5.2 Untuk Super Admin

1. **Dashboard** — semua order: draft, sedang dikerjakan, menunggu review, selesai.
2. **Buat order baru:**
   - Data klien (nama, no HP, email).
   - Data mobil & lokasi.
   - Jadwal & pilih template inspeksi.
   - Assign ke inspektor.
3. **Review laporan** sebelum dikirim ke klien — bisa edit catatan, tambah ringkasan, kasih skor akhir.
4. **Export PDF** — generate laporan PDF yang rapi & profesional, lalu dikirim manual ke klien (via WA/email di luar app).
5. **Manajemen inspektor:**
   - **Buat akun inspektor** baru (username + password ditentukan Super Admin).
   - Nonaktifkan / aktifkan kembali akun.
   - Reset password inspektor.
   - Lihat performa inspektor.
6. **Manajemen Template Inspeksi:**
   - **Buat template baru** — tentukan nama template, kategori, dan item inspeksi di dalamnya.
   - **Edit template** — tambah/hapus/ubah urutan kategori dan item inspeksi.
   - **Duplikasi template** — salin template yang sudah ada untuk dijadikan basis template baru.
   - **Arsipkan template** — template tidak dihapus permanen, hanya di-arsip agar tidak muncul di pilihan.
7. **Manajemen Kategori & Item Inspeksi:**
   - Setiap template terdiri dari **kategori** (mis. Eksterior, Interior, Mesin).
   - Setiap kategori berisi **item inspeksi** (mis. "Body panel depan", "Kondisi ban").
   - Kategori dan item bisa **ditambah, diedit, dihapus, dan diurutkan ulang** sesuai kebutuhan.
   - Item inspeksi bisa diatur: nama, deskripsi, apakah foto wajib, apakah severity wajib diisi.
8. **Konfigurasi sistem** — pengaturan global aplikasi.

### 5.3 Distribusi Laporan ke Klien

1. Klien **tidak punya akun** dan **tidak mengakses web app**.
2. Setelah laporan di-review, Super Admin meng-**export laporan ke PDF**.
3. PDF berisi:
   - Ringkasan & skor keseluruhan.
   - Foto per kategori inspeksi.
   - Detail temuan dengan keterangan jelas (bahasa awam).
   - Rekomendasi dari inspektor.
4. Super Admin mengirim PDF ke klien secara manual (via WhatsApp / email — di luar app).
5. **Tidak ada laporan real-time** — klien hanya terima PDF setelah inspeksi selesai dan di-review.

---

## 6. Fitur Tambahan (Setelah MVP)

- **Voice-to-text** untuk isi catatan tanpa ngetik.
- **AI bantu deskripsi** — dari foto, otomatis kasih saran catatan ("kemungkinan repaint di pintu kanan").
- **Bandingkan dengan inspeksi sebelumnya** (kalau mobil yang sama pernah diinspeksi).
- **Tanda tangan digital** klien & inspektor di laporan akhir.
- **Statistik tim** — berapa mobil per inspektor per bulan, rata-rata durasi, dll.
- **Integrasi WhatsApp Business** untuk kirim laporan resmi.
- **Watermark foto otomatis** (logo + tanggal + lokasi GPS) — anti dispute.

---

## 7. Alur Kerja Tipikal (Happy Path)

### 7.1 Setup Awal
1. **Super Admin** login dengan akun default (`arya` / `macbookPro13`) → ganti password.
2. Super Admin buat **template inspeksi** (atur kategori & item inspeksi).
3. Super Admin buat akun **Inspektor**.

### 7.2 Proses Inspeksi
1. **Super Admin** terima permintaan inspeksi dari klien (via WA/telepon — di luar app).
2. Super Admin buat order baru di dashboard, isi data klien & mobil, pilih template inspeksi, assign ke inspektor.
3. **Inspektor** buka app di HP → login → lihat detail order.
4. Inspektor datang ke lokasi mobil → mulai inspeksi → isi checklist + foto per titik.
   - Data otomatis tersimpan secara berkala (auto-save ke lokal & Supabase).
   - Jika koneksi putus → inspektor tetap bisa melanjutkan → data tersimpan lokal.
   - Saat koneksi kembali → sync otomatis ke Supabase.
5. Selesai → submit. Status: "Menunggu Review".
6. **Super Admin** review, tambah ringkasan & skor → export PDF.
7. Super Admin kirim **file PDF** ke klien via WA/email (di luar app).

---

## 8. Stack Teknis (Final)

- **Hosting:** **Vercel** (Hobby tier untuk MVP, naik ke Pro saat dibutuhkan).
- **Frontend:** Next.js + Tailwind CSS, didesain mobile-first (PWA biar berasa kayak app).
- **Backend, database, storage:** **Supabase**
  - Postgres untuk data order, inspektor, checklist, laporan, template inspeksi.
  - Supabase Storage untuk foto & video inspeksi.
  - Row Level Security (RLS) supaya inspektor hanya bisa lihat order miliknya sendiri.
- **Autentikasi:** **Custom auth sederhana** (tanpa Supabase Auth / OAuth / OTP).
  - Login via username + password.
  - Password di-hash (bcrypt) sebelum disimpan.
  - Session management via JWT token.
  - Akun inspektor dibuat oleh Super Admin (bukan self-register).
  - Default super admin: `arya` / `macbookPro13` (wajib ganti setelah login pertama).
- **Offline & auto-save:**
  - **IndexedDB** untuk menyimpan data inspeksi secara lokal di browser.
  - **Service Worker** untuk memungkinkan akses offline.
  - **Auto-save berkala ke Supabase** — setiap perubahan di-sync saat koneksi tersedia.
  - **Conflict resolution:** timestamp-based — data terbaru menang (last-write-wins).
  - **Queue system:** perubahan offline di-queue, lalu di-replay saat koneksi kembali.
  - Inspeksi yang belum selesai tersimpan di Supabase → bisa dilanjutkan dari device lain.
- **PDF generator:** untuk laporan final yang di-export Super Admin (mis. react-pdf / Puppeteer di Vercel Function).
- **Distribusi laporan:** Manual oleh Super Admin — kirim file PDF via WA/email di luar app (tidak ada sistem notifikasi otomatis ke klien di MVP).
- **Kamera & GPS:** akses native browser (foto langsung + watermark koordinat).

**Estimasi biaya awal:** Rp 0/bulan saat MVP (Vercel Hobby + Supabase Free). Naik ~Rp 700rb/bulan saat trafik & storage tumbuh.

---

## 9. Metrik Keberhasilan

- **Rata-rata waktu pengisian laporan di lapangan** (target: < 45 menit).
- **Waktu dari inspeksi selesai → laporan terkirim ke klien** (target: < 3 jam).
- **Tingkat kelengkapan checklist** (target: 100% titik wajib terisi).
- **Kepuasan inspektor** terhadap kemudahan app (survey internal).
- **Komplain klien soal kualitas laporan** (target: turun seiring waktu).

---

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Sinyal jelek di lapangan / basement | Mode offline + auto-save lokal (IndexedDB) + sync otomatis ke Supabase saat koneksi kembali |
| Koneksi putus di tengah inspeksi | Data tersimpan otomatis di lokal & Supabase — bisa dilanjutkan kapanpun tanpa mengulang dari awal |
| Foto banyak → kuota data inspektor habis | Kompresi foto otomatis sebelum upload + opsi upload saat WiFi |
| Inspektor gaptek, susah pakai app baru | UI sangat sederhana + training awal + tombol besar |
| HP inspektor low-end / storage penuh | Foto langsung upload + hapus lokal setelah sync |
| Laporan keluar sebelum di-review Super Admin | Wajib status "Menunggu Review" sebelum bisa export PDF |
| Konflik data saat sync (edit di 2 device) | Last-write-wins berdasarkan timestamp — data terbaru yang disimpan |
| Password default bocor | Wajib ganti password default super admin setelah login pertama |

---

## 11. Roadmap Singkat

- **Bulan 1:** Desain UI/UX (terutama flow inspektor di HP) + setup teknis.
- **Bulan 2:** Bangun MVP — login, order, checklist, foto, submit, review Super Admin, export PDF.
- **Bulan 3:** Internal testing dengan 1–2 inspektor di lapangan, perbaiki bug & UX.
- **Bulan 4:** Rilis ke seluruh tim + fitur offline mode disempurnakan.
- **Bulan 5+:** Fitur tambahan (voice-to-text, AI bantu, statistik tim).

---

## 12. Pertanyaan Terbuka

1. **Berapa orang inspektor** yang akan pakai di awal?
2. ~~Apakah sudah ada template checklist baku?~~ → **Terjawab:** Template bisa dibuat & diedit sendiri oleh Super Admin.
3. ~~Apakah klien butuh lihat laporan real-time?~~ → **Terjawab:** Tidak. Klien hanya terima PDF setelah selesai & di-review.
4. **Format laporan PDF** — apakah ada referensi desain / contoh laporan yang sudah dipakai sekarang?
5. **Logo & identitas visual** InpectPro — sudah ada, atau perlu dibuat dulu?

---

## 13. Catatan Revisi

### v0.4
| No | Perubahan | Alasan |
|---|---|---|
| 1 | Login tanpa autentikasi eksternal (OTP/OAuth), username+password | Kesederhanaan, tidak butuh integrasi pihak ketiga |
| 2 | Tambah role Super Admin dengan default akun `arya` / `macbookPro13` | Akses awal sistem |
| 3 | Inspector dibuat oleh admin (bukan self-register) | Kontrol akses ketat |
| 4 | Item & kategori inspeksi sepenuhnya editable | Fleksibilitas SOP |
| 5 | Tambah fitur template inspeksi (CRUD + duplikasi) | Standarisasi & variasi jenis inspeksi |
| 6 | Tidak butuh laporan real-time | Klien cukup lihat setelah review |
| 7 | Mitigasi offline diperkuat: auto-save ke Supabase, bisa dilanjutkan kapanpun | Menghindari kehilangan data & pengulangan kerja |

### v0.5
| No | Perubahan | Alasan |
|---|---|---|
| 1 | Hapus role Supervisor — hanya Super Admin & Inspektor | Simplifikasi, tim masih kecil |
| 2 | Semua fitur Supervisor digabung ke Super Admin | Satu role admin yang mengelola semuanya |
| 3 | Hapus fitur link laporan web untuk klien | Klien cukup terima PDF |
| 4 | Klien hanya terima file PDF hasil export | Distribusi manual via WA/email oleh Super Admin |
| 5 | Hapus notifikasi otomatis ke klien (email/WA dari app) | Tidak dibutuhkan di MVP, kirim manual saja |
