"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Minus,
  Camera,
  Send,
  Car,
  ClipboardCheck,
  WifiOff,
} from "lucide-react";
import { getOfflineOrderDetail, saveOfflineOrderDetail, queueOfflineUpdate } from "@/lib/offline-db";

export default function InspectionSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [notes, setNotes] = useState("");

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

  const loadSummaryData = async () => {
    setLoading(true);
    try {
      let orderData = null;
      if (navigator.onLine) {
        const res = await fetch(`/api/admin/orders/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.order) {
            orderData = data.order;
            await saveOfflineOrderDetail(id, data.order);
          }
        }
      }

      if (!orderData) {
        orderData = await getOfflineOrderDetail(id);
      }

      if (orderData) {
        setOrder(orderData);
        setNotes(orderData.notes || "");
      }
    } catch (e) {
      console.error("Gagal memuat ringkasan inspeksi:", e);
      const cached = await getOfflineOrderDetail(id);
      if (cached) {
        setOrder(cached);
        setNotes(cached.notes || "");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummaryData();
  }, [id]);

  // Calculate actual checklist metrics
  const checklistCategories = order?.checklist || [];
  let totalItems = 0;
  let filledCount = 0;
  let okCount = 0;
  let attentionCount = 0;
  let problemCount = 0;
  let naCount = 0;
  let photoCount = 0;

  checklistCategories.forEach((cat: any) => {
    cat.items.forEach((item: any) => {
      totalItems++;
      if (item.status === "ok") {
        filledCount++;
        okCount++;
      } else if (item.status === "attention") {
        filledCount++;
        attentionCount++;
      } else if (item.status === "problem") {
        filledCount++;
        problemCount++;
      } else if (item.status === "na") {
        filledCount++;
        naCount++;
      }
      if (item.photos && Array.isArray(item.photos)) {
        photoCount += item.photos.length;
      }
    });
  });

  const handleSubmit = async () => {
    if (!order) return;
    setIsSubmitting(true);
    
    try {
      if (navigator.onLine) {
        const res = await fetch(`/api/admin/orders/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "pending_review",
            notes: notes,
          }),
        });

        if (res.ok) {
          const updatedOrder = { ...order, status: "pending_review", notes };
          await saveOfflineOrderDetail(id, updatedOrder);
          setSubmitted(true);
          return;
        }
      }

      // Offline flow: Queue submission and update offline state
      await queueOfflineUpdate(id, { status: "pending_review", summaryNotes: notes });
      const updatedOrder = { ...order, status: "pending_review", notes };
      await saveOfflineOrderDetail(id, updatedOrder);
      setSubmitted(true);
    } catch (err) {
      console.error("Gagal mengirim laporan:", err);
      // Offline fallback
      await queueOfflineUpdate(id, { status: "pending_review", summaryNotes: notes });
      const updatedOrder = { ...order, status: "pending_review", notes };
      await saveOfflineOrderDetail(id, updatedOrder);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <p className="text-sm text-text-secondary">Memuat ringkasan...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-surface-secondary flex flex-col items-center justify-center p-4 text-center">
        <p className="text-sm text-text-secondary mb-4">Order tidak ditemukan</p>
        <button
          onClick={() => router.push("/inspector/dashboard")}
          className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-semibold"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center px-4">
        <div className="text-center animate-scale-in max-w-sm w-full">
          <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-success/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Laporan Terkirim!
          </h1>
          <p className="text-sm text-text-secondary mt-2 mb-8">
            Laporan inspeksi berhasil dikirim dan sedang menunggu review dari Super Admin.
          </p>
          <button
            onClick={() => router.push("/inspector/dashboard")}
            className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3.5 rounded-2xl transition-all cursor-pointer active:scale-[0.98] text-sm"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-primary-dark text-white px-4 h-14 flex items-center gap-3 shadow-md">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Ringkasan Inspeksi</p>
            {isOffline && (
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
            )}
          </div>
          <p className="text-[10px] text-white/60">{order.order_number}</p>
        </div>
        <span className="text-xs bg-white/10 px-3 py-1 rounded-full">
          Step 3/3
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full space-y-4">
        {/* Vehicle Summary */}
        <div className="bg-white rounded-2xl border border-border shadow-xs p-5 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                {order.vehicle.brand} {order.vehicle.model}
              </h2>
              <p className="text-xs text-text-secondary">
                {order.vehicle.year} · {order.vehicle.plate_number} · {order.vehicle.color}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in delay-1">
          <div className="bg-white rounded-xl border border-border p-4 text-center shadow-xs">
            <ClipboardCheck className="w-5 h-5 text-text-tertiary mx-auto mb-2" />
            <p className="text-xl font-bold text-text-primary">
              {filledCount}/{totalItems}
            </p>
            <p className="text-[10px] text-text-tertiary mt-0.5">Item Terisi</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 text-center shadow-xs">
            <Camera className="w-5 h-5 text-text-tertiary mx-auto mb-2" />
            <p className="text-xl font-bold text-text-primary">{photoCount}</p>
            <p className="text-[10px] text-text-tertiary mt-0.5">Foto</p>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white rounded-2xl border border-border shadow-xs p-5 animate-fade-in delay-2">
          <h3 className="text-sm font-semibold text-text-primary mb-4">
            Ringkasan Status
          </h3>
          <div className="space-y-3">
            {[
              { icon: CheckCircle2, label: "OK", count: okCount, color: "text-success", bg: "bg-success", barBg: "bg-success" },
              { icon: AlertTriangle, label: "Perhatian", count: attentionCount, color: "text-warning", bg: "bg-warning", barBg: "bg-warning" },
              { icon: XCircle, label: "Bermasalah", count: problemCount, color: "text-danger", bg: "bg-danger", barBg: "bg-danger" },
              { icon: Minus, label: "N/A", count: naCount, color: "text-text-tertiary", bg: "bg-slate-400", barBg: "bg-slate-300" },
            ].map((stat) => {
              const Icon = stat.icon;
              const pct = totalItems > 0 ? (stat.count / totalItems) * 100 : 0;
              return (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-24">
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-xs text-text-secondary">{stat.label}</span>
                  </div>
                  <div className="flex-1 h-2 bg-surface-tertiary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stat.barBg} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-text-primary w-8 text-right">
                    {stat.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-category summary */}
        <div className="bg-white rounded-2xl border border-border shadow-xs p-5 animate-fade-in delay-3">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Per Kategori
          </h3>
          <div className="space-y-2">
            {checklistCategories.map((cat: any) => {
              const catFilled = cat.items.filter((i: any) => i.status !== null && i.status !== undefined).length;
              const isCatComplete = catFilled === cat.items.length;
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-2 border-b border-border-light last:border-0"
                >
                  <span className="text-sm text-text-secondary">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium bg-surface-tertiary text-text-secondary px-2 py-0.5 rounded-full">
                      {catFilled}/{cat.items.length} item
                    </span>
                    {isCatComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-border shadow-xs p-5 animate-fade-in delay-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            Catatan Tambahan
          </h3>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan keseluruhan untuk inspeksi ini (opsional)"
            className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all resize-none"
          />
        </div>

        {/* Checklist completeness warning */}
        {filledCount < totalItems && (
          <div className="bg-warning-bg border border-amber-200 rounded-xl p-4 flex items-start gap-3 animate-fade-in delay-5">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Checklist belum lengkap
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {totalItems - filledCount} item belum diisi. Harap periksa kembali untuk memastikan semua titik krusial dinilai sebelum menyerahkan laporan.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-white border-t border-border px-4 py-3 shadow-lg">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-success hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-success/20 transition-all cursor-pointer active:scale-[0.98] text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Mengirim Laporan...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Laporan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
