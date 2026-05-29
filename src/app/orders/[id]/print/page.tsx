"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Printer,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  User,
  Shield,
  Layers,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  name: string;
  status: string;
  notes: string;
  photos: string[];
}

interface ChecklistCategory {
  id: string;
  name: string;
  items: ChecklistItem[];
}

interface OrderDetail {
  id: string;
  order_number: string;
  client: {
    name: string;
    phone: string;
    email: string;
  };
  vehicle: {
    brand: string;
    model: string;
    type?: string;
    year: number;
    plate_number: string;
    chassis_number?: string;
    engine_number?: string;
    odometer_km: number;
    odometer_photo?: string;
    color: string;
    transmission: string;
    fuel_type: string;
  };
  location: string;
  schedule_date: string;
  schedule_time: string;
  inspector_name: string;
  status: string;
  notes?: string;
  checklist: ChecklistCategory[];
  review: {
    overall_score: number;
    summary: string;
    recommendation: string;
    reviewed_at: string;
  } | null;
}

export default function PrintReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const articleRef = useRef<HTMLDivElement>(null);
  const hasPrinted = useRef(false);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/admin/orders/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat detail laporan");
        setOrder(data.order);
      } catch (err: any) {
        setError(err.message || "Gagal memuat data laporan dari server");
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [id]);

  // Pemicu otomatis dialog cetak — tunggu SEMUA gambar selesai dimuat dulu
  // agar foto lampiran tidak hilang di hasil PDF.
  useEffect(() => {
    if (!order || loading || error || hasPrinted.current) return;

    let cancelled = false;

    const triggerPrint = () => {
      if (cancelled || hasPrinted.current) return;
      hasPrinted.current = true;
      window.print();
    };

    const waitForImages = async () => {
      // Beri waktu DOM render dulu
      await new Promise((r) => setTimeout(r, 100));
      const imgs = Array.from(articleRef.current?.querySelectorAll("img") ?? []);
      await Promise.all(
        imgs.map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete && img.naturalWidth > 0) return resolve();
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
            })
        )
      );
      // Buffer kecil untuk layout & font
      await new Promise((r) => setTimeout(r, 400));
      triggerPrint();
    };

    // Fallback maksimum 6 detik agar tidak menggantung selamanya
    const fallback = setTimeout(triggerPrint, 6000);
    waitForImages();

    return () => {
      cancelled = true;
      clearTimeout(fallback);
    };
  }, [order, loading, error]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-600 print:hidden">
        <span className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-accent mb-4" />
        <h2 className="text-base font-semibold">Menyusun Laporan Inspeksi...</h2>
        <p className="text-xs text-slate-400 mt-1">Mengumpulkan data checklist dan hasil review</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center print:hidden">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-slate-800">Laporan Gagal Dimuat</h2>
        <p className="text-sm text-slate-500 max-w-md mt-1">{error || "Data order tidak ditemukan."}</p>
        <button
          onClick={() => router.back()}
          className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Kembali
        </button>
      </div>
    );
  }

  // Ringkasan Jumlah Temuan
  let okCount = 0;
  let attentionCount = 0;
  let problemCount = 0;
  let naCount = 0;

  order.checklist.forEach((cat) => {
    cat.items.forEach((item) => {
      if (item.status === "ok") okCount++;
      else if (item.status === "attention") attentionCount++;
      else if (item.status === "problem") problemCount++;
      else naCount++;
    });
  });

  const score = order.review?.overall_score ?? 0;
  const scoreLabel =
    score >= 85 ? "Kondisi Prima" : score >= 70 ? "Kondisi Baik" : score >= 50 ? "Perlu Perhatian" : "Perlu Perbaikan";
  const scoreTone =
    score >= 70 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 md:py-10 md:px-8 print:bg-white print:p-0 print:m-0">
      {/* Tombol Aksi Web (Hanya Tampil di Layar Browser) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden animate-fade-in">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-sm flex-shrink-0"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan / Save as PDF
          </button>
        </div>
      </div>

      {/* Konten Utama Laporan */}
      <article
        ref={articleRef}
        className="report-doc max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-10 md:p-12 print:border-none print:shadow-none print:p-0 print:rounded-none"
      >

        {/* Halaman 1: Cover / Ringkasan Utama Laporan */}
        <section className="space-y-8 pb-10 print:pb-0">
          {/* Cover Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-dark rounded-2xl flex items-center justify-center shadow-md shadow-primary/20 p-2.5">
                <img src="/brand/logogram.svg" alt="" className="w-full h-full" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none print:text-2xl">
                  InpectPro
                </h1>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1 block">
                  Laporan Inspeksi Otomotif
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 uppercase tracking-wide inline-block">
                No. Order: {order.order_number}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">
                Laporan Dibuat: {order.review ? new Date(order.review.reviewed_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>

          {/* Banner & Cover Title — versi terang */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
            <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent" />
            <div className="relative z-10 space-y-2 pl-2">
              <span className="text-[10px] text-accent font-extrabold uppercase tracking-widest">
                Laporan Resmi
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-slate-900">
                LAPORAN INSPEKSI KENDARAAN
              </h2>
              <p className="text-xs text-slate-500 max-w-md">
                Laporan hasil pengecekan menyeluruh kondisi eksterior, interior, mesin, kaki-kaki, kolong, dan kelayakan jalan kendaraan.
              </p>
            </div>
            {order.review && (
              <div className="flex-shrink-0 flex flex-col items-center justify-center bg-white rounded-2xl px-6 py-4 border border-slate-200 shadow-sm text-center min-w-[140px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Skor Penilaian
                </span>
                <span className={`text-4xl sm:text-5xl font-black mt-1 ${scoreTone}`}>
                  {order.review.overall_score}
                </span>
                <span className={`text-[9px] font-bold mt-1 uppercase tracking-widest ${scoreTone}`}>
                  {scoreLabel}
                </span>
              </div>
            )}
          </div>

          {/* Data Kendaraan & Klien */}
          <div className="grid md:grid-cols-2 gap-6 pt-2">
            {/* Spesifikasi Kendaraan */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                <Car className="w-4 h-4 text-slate-500" /> Spesifikasi Mobil
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 uppercase text-[9px] tracking-wider">Merk & Model</p>
                  <p className="font-bold text-slate-900 mt-0.5">{order.vehicle.brand} {order.vehicle.model}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase text-[9px] tracking-wider">Tipe & Tahun</p>
                  <p className="font-bold text-slate-900 mt-0.5">{order.vehicle.type || "-"} · {order.vehicle.year}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase text-[9px] tracking-wider">Plat Nomor</p>
                  <p className="font-bold text-slate-900 mt-0.5">{order.vehicle.plate_number}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase text-[9px] tracking-wider">Jarak Tempuh</p>
                  <p className="font-bold text-slate-900 mt-0.5">{order.vehicle.odometer_km.toLocaleString("id-ID")} KM</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase text-[9px] tracking-wider">Transmisi</p>
                  <p className="font-bold text-slate-900 mt-0.5 uppercase">{order.vehicle.transmission === "automatic" ? "Otomatis" : "Manual"}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase text-[9px] tracking-wider">Bahan Bakar</p>
                  <p className="font-bold text-slate-900 mt-0.5 uppercase">{order.vehicle.fuel_type}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase text-[9px] tracking-wider">Warna Kendaraan</p>
                  <p className="font-bold text-slate-900 mt-0.5">{order.vehicle.color}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase text-[9px] tracking-wider">No. Rangka</p>
                  <p className="font-bold text-slate-900 mt-0.5 truncate">{order.vehicle.chassis_number || "-"}</p>
                </div>
              </div>
            </div>

            {/* Administrasi & Pihak Terkait */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" /> Detail Pemesanan
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 uppercase text-[9px] tracking-wider">Nama Klien</p>
                  <p className="font-bold text-slate-900 mt-0.5">{order.client.name}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase text-[9px] tracking-wider">Kontak HP</p>
                  <p className="font-bold text-slate-900 mt-0.5">{order.client.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 uppercase text-[9px] tracking-wider">Email Klien</p>
                  <p className="font-bold text-slate-900 mt-0.5 break-all">{order.client.email || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase text-[9px] tracking-wider">Tanggal Inspeksi</p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {new Date(order.schedule_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 uppercase text-[9px] tracking-wider">Inspektur Lapangan</p>
                  <p className="font-bold text-slate-950 mt-0.5 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-accent" />
                    {order.inspector_name}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 uppercase text-[9px] tracking-wider">Lokasi Pemeriksaan</p>
                  <p className="font-bold text-slate-900 mt-0.5 line-clamp-1">{order.location}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Temuan Ringkasan Checklist */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl py-3 px-2 text-center">
              <span className="block text-xl font-extrabold text-emerald-700">{okCount}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-600/80">Kondisi Baik</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl py-3 px-2 text-center">
              <span className="block text-xl font-extrabold text-amber-600">{attentionCount}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-amber-600/80">Perhatian</span>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl py-3 px-2 text-center">
              <span className="block text-xl font-extrabold text-red-600">{problemCount}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-red-600/80">Bermasalah</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-2 text-center">
              <span className="block text-xl font-extrabold text-slate-500">{naCount}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">N/A</span>
            </div>
          </div>

          {/* Kesimpulan Review Admin — versi terang */}
          {order.review && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 print:break-inside-avoid">
              <h3 className="text-xs font-bold uppercase tracking-wider text-accent border-b border-slate-200 pb-2">
                Ringkasan & Analisis Temuan
              </h3>
              <div className="space-y-3 text-xs leading-relaxed">
                <div>
                  <p className="text-slate-500 font-bold">Catatan Hasil Review:</p>
                  <p className="text-slate-800 mt-1">{order.review.summary}</p>
                </div>
                <div>
                  <p className="text-slate-500 font-bold">Rekomendasi Ahli:</p>
                  <p className="text-slate-800 mt-1 bg-white p-3 rounded-xl border border-slate-200">{order.review.recommendation}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Halaman 2+: Rincian Temuan Per Kategori */}
        <section className="pt-10 space-y-8 print:break-before-page print:pt-0">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent" /> RINCIAN CHECKLIST PEMERIKSAAN
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Berikut adalah detail status pemeriksaan per poin kategori kendaraan.</p>
          </div>

          {order.checklist.map((cat) => (
            <div key={cat.id} className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between print:break-after-avoid">
                <span>{cat.name}</span>
                <span className="text-[10px] font-normal text-slate-400 normal-case">{cat.items.length} Titik Cek</span>
              </h3>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {cat.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white grid sm:grid-cols-12 gap-4 items-start print:py-3 print:px-4 print:break-inside-avoid"
                  >
                    {/* Nama Poin Checklist */}
                    <div className="sm:col-span-3 space-y-1">
                      <p className="text-xs font-bold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Titik Cek #{item.id.substring(0, 4)}</p>
                    </div>

                    {/* Status */}
                    <div className="sm:col-span-2">
                      {item.status === "ok" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Baik
                        </span>
                      )}
                      {item.status === "attention" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" /> Perhatian
                        </span>
                      )}
                      {item.status === "problem" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                          <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" /> Bermasalah
                        </span>
                      )}
                      {item.status === "na" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                          N/A
                        </span>
                      )}
                    </div>

                    {/* Catatan / Keterangan Temuan — kosongkan bila tidak ada catatan */}
                    <div className="sm:col-span-3 text-xs text-slate-600 leading-relaxed italic">
                      {item.notes ? `"${item.notes}"` : null}
                    </div>

                    {/* Foto-Foto Lampiran */}
                    <div className="sm:col-span-4">
                      {item.photos && item.photos.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {item.photos.slice(0, 2).map((photoUrl, pIdx) => (
                            <div key={pIdx} className="h-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photoUrl}
                                alt={`Temuan ${item.name}`}
                                loading="eager"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Footer Penutup Laporan (tanpa tanda tangan) */}
        <section className="mt-12 pt-6 border-t border-slate-200 text-center print:break-inside-avoid">
          <p className="text-[10px] text-slate-400 leading-relaxed max-w-lg mx-auto">
            Laporan ini dihasilkan oleh sistem InpectPro berdasarkan hasil inspeksi lapangan oleh{" "}
            <span className="font-semibold text-slate-500">{order.inspector_name}</span>
            {order.review ? " dan telah ditinjau oleh tim Super Admin." : "."}
          </p>
          <p className="text-[9px] text-slate-300 mt-2 uppercase tracking-widest font-semibold">
            InpectPro · Automotive Inspection
          </p>
        </section>

      </article>

      {/* Gaya Cetak Khusus PDF */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Paksa skema warna terang — cegah Chrome auto dark mode membalik warna saat cetak */
        html, .report-doc {
          color-scheme: light only;
        }
        @media print {
          html, body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            color-scheme: light only;
          }
          .print\\:hidden {
            display: none !important;
          }
          /* Margin halaman cetak standar A4 */
          @page {
            size: A4;
            margin: 14mm 12mm 14mm 12mm;
          }
          .print\\:break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print\\:break-after-avoid {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
          .print\\:break-before-page {
            break-before: page !important;
            page-break-before: always !important;
          }
          /* Pastikan warna isi (latar kartu, badge, foto) tetap tercetak */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
}
