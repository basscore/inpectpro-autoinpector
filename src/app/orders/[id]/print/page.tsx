"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Calendar,
  MapPin,
  Clock,
  Printer,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  User,
  Shield,
  Layers,
} from "lucide-react";
import { ORDER_STATUS_CONFIG } from "@/lib/mock-data";

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
  const [isRendered, setIsRendered] = useState(false);

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

  // Pemicu otomatis untuk dialog cetak browser
  useEffect(() => {
    if (order && !loading && !error) {
      const timer = setTimeout(() => {
        setIsRendered(true);
        window.print();
      }, 1500); // Tunggu render dom dan gambar selesai dimuat
      return () => clearTimeout(timer);
    }
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
      <article className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-10 md:p-12 print:border-none print:shadow-none print:p-0 print:rounded-none">
        
        {/* Halaman 1: Cover / Ringkasan Utama Laporan */}
        <section className="space-y-8 pb-10 border-b border-slate-200 print:min-h-[297mm] print:pb-0 print:border-none">
          {/* Cover Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-dark text-white rounded-2xl flex items-center justify-center shadow-md shadow-primary/20 p-2.5">
                <img src="/brand/logogram.svg" alt="" className="w-full h-full" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none print:text-2xl">
                  InpectPro
                </h1>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-1 block">
                  Automotive Inspection Certificate
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

          {/* Banner & Cover Title */}
          <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden print:bg-black">
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] text-accent-light font-extrabold uppercase tracking-widest">
                Official Certification
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                LAPORAN INSPEKSI KENDARAAN
              </h2>
              <p className="text-xs text-slate-400 max-w-md">
                Sertifikat hasil pengecekan menyeluruh kondisi eksterior, interior, mesin, kaki-kaki, kolong, dan kelayakan jalan kendaraan.
              </p>
            </div>
            {order.review && (
              <div className="flex-shrink-0 flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/15 text-center min-w-[140px] print:bg-neutral-800">
                <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                  Skor Penilaian
                </span>
                <span className="text-4xl sm:text-5xl font-black mt-1 text-white">
                  {order.review.overall_score}
                </span>
                <span className="text-[9px] text-emerald-400 font-bold mt-1 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Kondisi Prima
                </span>
              </div>
            )}
          </div>

          {/* Data Kendaraan & Klien */}
          <div className="grid md:grid-cols-2 gap-6 pt-2">
            {/* Spesifikasi Kendaraan */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 print:bg-neutral-50">
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
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 print:bg-neutral-50">
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
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl py-3 px-2 text-center print:bg-emerald-50/50 print:border-emerald-200">
              <span className="block text-xl font-extrabold text-emerald-700">{okCount}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-600/80">Kondisi Baik</span>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl py-3 px-2 text-center print:bg-amber-50/50 print:border-amber-200">
              <span className="block text-xl font-extrabold text-amber-600">{attentionCount}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-amber-600/80">Perhatian</span>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl py-3 px-2 text-center print:bg-red-50/50 print:border-red-200">
              <span className="block text-xl font-extrabold text-red-600">{problemCount}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-red-600/80">Bermasalah</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl py-3 px-2 text-center print:bg-slate-100">
              <span className="block text-xl font-extrabold text-slate-500">{naCount}</span>
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">N/A</span>
            </div>
          </div>

          {/* Kesimpulan Review Admin */}
          {order.review && (
            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 print:bg-neutral-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-accent-light border-b border-white/10 pb-2">
                Ringkasan & Analisis Temuan Super Admin
              </h3>
              <div className="space-y-3 text-xs leading-relaxed">
                <div>
                  <p className="text-slate-400 font-bold">Catatan Hasil Review:</p>
                  <p className="text-slate-200 mt-1">{order.review.summary}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold">Rekomendasi Ahli:</p>
                  <p className="text-slate-200 mt-1 bg-white/5 p-3 rounded-xl border border-white/10">{order.review.recommendation}</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Halaman 2+: Rincian Temuan Per Kategori */}
        <section className="pt-10 space-y-10">
          <div className="border-b border-slate-200 pb-2">
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent" /> RINCIAN CHECKLIST PEMERIKSAAN
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Berikut adalah detail status pemeriksaan per poin kategori kendaraan.</p>
          </div>

          {order.checklist.map((cat) => (
            <div
              key={cat.id}
              className="space-y-4 print:break-inside-avoid print:pt-6"
            >
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
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
                    <div className="sm:col-span-4 space-y-1">
                      <p className="text-xs font-bold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Titik Cek #{item.id.substring(0, 4)}</p>
                    </div>

                    {/* Status */}
                    <div className="sm:col-span-2">
                      {item.status === "ok" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md print:bg-white print:border-emerald-500">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> Baik
                        </span>
                      )}
                      {item.status === "attention" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md print:bg-white print:border-amber-500">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" /> Perhatian
                        </span>
                      )}
                      {item.status === "problem" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md print:bg-white print:border-red-500">
                          <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" /> Bermasalah
                        </span>
                      )}
                      {item.status === "na" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md print:bg-white print:border-slate-300">
                          N/A
                        </span>
                      )}

                    </div>

                    {/* Catatan / Keterangan Temuan */}
                    <div className="sm:col-span-3 text-xs text-slate-600 leading-relaxed italic">
                      {item.notes ? `"${item.notes}"` : <span className="text-slate-300 font-medium not-italic">Tidak ada temuan khusus.</span>}
                    </div>

                    {/* Foto-Foto Lampiran */}
                    <div className="sm:col-span-3">
                      {item.photos && item.photos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          {item.photos.slice(0, 2).map((photoUrl, pIdx) => (
                            <div key={pIdx} className="aspect-4/3 bg-slate-100 rounded-lg overflow-hidden border border-slate-200/60 relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photoUrl}
                                alt={`Temuan ${item.name}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-medium">Tanpa Lampiran Foto</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Footer Penutup Laporan */}
        <section className="mt-16 pt-10 border-t border-slate-200 grid grid-cols-2 gap-6 text-center text-xs print:break-inside-avoid">
          <div className="space-y-12">
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Inspektur Lapangan</p>
            <div>
              <p className="font-bold text-slate-900 border-b border-slate-300 pb-1 inline-block min-w-[160px]">
                {order.inspector_name}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Tanda Tangan & Nama Terang</p>
            </div>
          </div>
          <div className="space-y-12">
            <p className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Super Admin Reviewer</p>
            <div>
              <p className="font-bold text-slate-900 border-b border-slate-300 pb-1 inline-block min-w-[160px]">
                {order.review ? "Arya (Super Admin)" : "Super Admin"}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">Tanda Tangan & Nama Terang</p>
            </div>
          </div>
        </section>

      </article>

      {/* Gaya Cetak Khusus PDF (Sembunyikan Menu Cetak Web, Atur Margins) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          /* Atur margin halaman cetak standard */
          @page {
            size: A4;
            margin: 15mm 12mm 15mm 12mm;
          }
          /* Cegah pembelahan baris atau item yang tidak sedap dipandang */
          .print\\:break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Force core colors to show in PDF prints */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
}
