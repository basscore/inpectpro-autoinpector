"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  MapPin,
  Clock,
  Calendar,
  Phone,
  User,
  FileText,
  Navigation,
  Play,
  WifiOff,
  Download,
  ClipboardCheck,
  Camera,
} from "lucide-react";
import { ORDER_STATUS_CONFIG } from "@/lib/mock-data";
import { saveOfflineOrderDetail, queueOfflineUpdate, loadOrderDetailCacheFirst } from "@/lib/offline-db";
import { TopProgressBar, OrderDetailSkeleton } from "@/lib/ui";

export default function InspectorOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      const handleStatus = () => setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleStatus);
      window.addEventListener("offline", handleStatus);
      return () => {
        window.removeEventListener("online", handleStatus);
        window.removeEventListener("offline", handleStatus);
      };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadOrderDetailCacheFirst(id, (orderData) => {
        if (cancelled) return;
        setOrder(orderData);
        setLoading(false);
      });
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleStartInspection = async () => {
    if (!order) return;

    setUpdating(true);
    const updatedLocal = { ...order, status: "in_progress" };

    // Persist lokal dulu (cepat) supaya halaman /inspect baca status terbaru.
    try {
      await Promise.all([
        saveOfflineOrderDetail(id, updatedLocal),
        queueOfflineUpdate(id, { status: "in_progress" }),
      ]);
    } catch (e) {
      console.error("Persist lokal status gagal:", e);
    }

    // Navigate sekarang. PUT server jalan di background.
    router.push(`/inspector/orders/${id}/inspect`);
    setUpdating(false);

    void (async () => {
      if (!navigator.onLine) return;
      try {
        await fetch(`/api/admin/orders/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "in_progress" }),
        });
        // Queue dibersihkan oleh syncOfflineData() — jangan hapus di sini
        // agar tidak menghapus update halaman lain yang ikut ter-merge.
      } catch (err) {
        console.error("Background PUT status gagal — data aman di queue:", err);
      }
    })();
  };

  if (loading) {
    return <OrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto text-center min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-text-secondary">Order tidak ditemukan</p>
        <button
          onClick={() => router.push("/inspector/dashboard")}
          className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
    label: order.status,
    bg: "bg-gray-100",
    color: "text-gray-700",
  };

  // Hitung progres checklist
  const checklistCats: any[] = order.checklist || [];
  let totalItems = 0;
  let filledItems = 0;
  let photoCount = 0;
  checklistCats.forEach((cat: any) => {
    (cat.items || []).forEach((item: any) => {
      totalItems++;
      if (item.is_answered === true || (item.status != null && item.status !== "")) {
        filledItems++;
      }
      if (Array.isArray(item.photos)) photoCount += item.photos.length;
    });
  });
  const progressPct = totalItems > 0 ? Math.round((filledItems / totalItems) * 100) : 0;
  const isResuming = order.status === "in_progress" && filledItems > 0;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-4 min-h-screen pb-24">
      <TopProgressBar active={updating} label="Memuat halaman inspeksi..." />
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-in">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-text-primary">Detail Order</h1>
            {isOffline && (
              <span className="flex items-center gap-1 text-[9px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                <WifiOff className="w-2.5 h-2.5" /> Offline
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary">{order.order_number}</p>
        </div>
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}
        >
          {statusConfig.label}
        </span>
      </div>

      {/* Vehicle Card */}
      <div className="bg-white rounded-2xl border border-border p-5 shadow-xs animate-fade-in delay-1">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center">
            <Car className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {order.vehicle.brand} {order.vehicle.model}
            </h2>
            <p className="text-sm text-text-secondary">
              {order.vehicle.type} · {order.vehicle.year}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border-light">
          <div>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
              Plat
            </p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">
              {order.vehicle.plate_number || "-"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
              Warna
            </p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">
              {order.vehicle.color || "-"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
              Transmisi
            </p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">
              {order.vehicle.transmission === "automatic" ? "Otomatis" : "Manual"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
              Odometer
            </p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">
              {order.vehicle.odometer_km?.toLocaleString("id-ID") || 0} km
            </p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="space-y-3 animate-fade-in delay-2">
        {/* Schedule */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-info" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
              Jadwal
            </p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">
              {new Date(order.schedule_date).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              · {order.schedule_time}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-xs flex items-start gap-4">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
              Lokasi
            </p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">
              {order.location}
            </p>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.location)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary transition-colors cursor-pointer flex-shrink-0"
          >
            <Navigation className="w-4 h-4" />
          </a>
        </div>

        {/* Client */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
              Klien
            </p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">
              {order.client?.name}
            </p>
          </div>
          {order.client?.phone && (
            <a
              href={`tel:${order.client.phone}`}
              className="p-2 rounded-lg bg-success/10 hover:bg-success/20 text-success transition-colors cursor-pointer flex-shrink-0"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Template */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-teal-600" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-text-tertiary uppercase tracking-wider">
              Template
            </p>
            <p className="text-sm font-semibold text-text-primary mt-0.5">
              {order.template_name || "Template Inspeksi"}
            </p>
          </div>
        </div>
      </div>

      {/* Ringkasan Progres Inspeksi */}
      {(order.status === "in_progress" || order.status === "pending_review" || order.status === "completed") && totalItems > 0 && (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-xs animate-fade-in delay-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-accent" />
              Progres Inspeksi
            </h3>
            <span className="text-xs font-semibold text-accent">{progressPct}%</span>
          </div>
          <div className="h-2 bg-surface-secondary rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary">{filledItems}</p>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Terisi</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-warning">{totalItems - filledItems}</p>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Belum</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-text-primary flex items-center justify-center gap-1">
                <Camera className="w-4 h-4 text-text-tertiary" />
                {photoCount}
              </p>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wider">Foto</p>
            </div>
          </div>
          {checklistCats.length > 0 && order.status === "in_progress" && (
            <div className="mt-4 pt-4 border-t border-border-light space-y-1.5">
              {checklistCats.map((cat: any) => {
                const catFilled = (cat.items || []).filter(
                  (i: any) => i.is_answered === true || (i.status != null && i.status !== "")
                ).length;
                const total = cat.items?.length || 0;
                const done = catFilled === total && total > 0;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className={done ? "text-success" : "text-text-secondary"}>
                      {cat.name}
                    </span>
                    <span className={`font-medium ${done ? "text-success" : "text-text-secondary"}`}>
                      {catFilled}/{total}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Start Inspection CTA */}
      {(order.status === "assigned" || order.status === "in_progress") && (
        <div className="pt-2 animate-fade-in delay-3">
          <button
            onClick={handleStartInspection}
            disabled={updating}
            className="w-full bg-accent hover:bg-accent-dark text-white font-bold text-center py-4 rounded-2xl shadow-lg shadow-accent/20 transition-all cursor-pointer active:scale-[0.98] text-base disabled:opacity-75 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            {updating
              ? "Memproses..."
              : order.status === "in_progress"
              ? "Lanjutkan Inspeksi"
              : "Mulai Inspeksi"}
          </button>
        </div>
      )}

      {/* Export PDF CTA */}
      {order.status === "completed" && (
        <div className="pt-2 animate-fade-in delay-3">
          <Link
            href={`/orders/${order.id}/print`}
            target="_blank"
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-center py-4 rounded-2xl shadow-lg shadow-primary/20 transition-all cursor-pointer active:scale-[0.98] text-base flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export PDF Laporan
          </Link>
        </div>
      )}
    </div>
  );
}
