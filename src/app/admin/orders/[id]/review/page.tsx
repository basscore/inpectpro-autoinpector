"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Minus,
  Camera,
  MessageSquare,
  AlertCircle,
  Save,
} from "lucide-react";

const statusIcons = {
  ok: { icon: CheckCircle2, color: "text-success", bg: "bg-success-bg", label: "OK" },
  attention: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning-bg", label: "Perhatian" },
  problem: { icon: XCircle, color: "text-danger", bg: "bg-danger-bg", label: "Bermasalah" },
  na: { icon: Minus, color: "text-text-tertiary", bg: "bg-surface-tertiary", label: "N/A" },
};

const severityConfig = {
  ringan: { color: "text-amber-600", bg: "bg-amber-50", label: "Ringan" },
  sedang: { color: "text-orange-600", bg: "bg-orange-50", label: "Sedang" },
  berat: { color: "text-red-600", bg: "bg-red-50", label: "Berat" },
};

interface InspectionItem {
  id: string;
  name: string;
  description?: string;
  status: "ok" | "attention" | "problem" | "na";
  severity?: "ringan" | "sedang" | "berat";
  notes?: string;
  photos: string[];
}

interface InspectionCategory {
  id: string;
  name: string;
  items: InspectionItem[];
}

interface Client {
  name: string;
}

interface Vehicle {
  brand: string;
  model: string;
}

interface Order {
  id: string;
  order_number: string;
  client: Client;
  vehicle: Vehicle;
  checklist: InspectionCategory[];
  review?: {
    overall_score?: number;
    summary?: string;
    recommendation?: string;
  };
}

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [score, setScore] = useState(80);
  const [summary, setSummary] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/admin/orders/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat rincian order");
      
      const ord = data.order;
      setOrder(ord);
      if (ord.review) {
        setScore(ord.review.overall_score ?? 80);
        setSummary(ord.review.summary ?? "");
        setRecommendation(ord.review.recommendation ?? "");
      }
      setExpandedCategories((ord.checklist || []).map((c: any) => c.id));
    } catch (err: any) {
      setError(err.message || "Gagal menghubungkan ke server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const handleSaveReview = async () => {
    if (!summary.trim() || !recommendation.trim()) {
      setError("Ringkasan temuan dan rekomendasi wajib diisi");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/orders/${id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overall_score: score,
          summary,
          recommendation,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan review");

      router.push("/admin/orders");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal menghubungkan ke server");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-12 text-center text-text-secondary">
        <span className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-2" />
        <p>Memuat rincian laporan inspeksi...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-border p-6 space-y-4 text-center mt-12">
        <AlertCircle className="w-12 h-12 text-danger mx-auto" />
        <h3 className="text-base font-semibold text-text-primary">Gagal Memuat Laporan</h3>
        <p className="text-sm text-text-secondary">{error}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  // Calculate stats from hierarchal list
  const categories = order?.checklist || [];
  const allItems = categories.flatMap((c) => c.items || []);
  const okCount = allItems.filter((i) => i.status === "ok").length;
  const attentionCount = allItems.filter((i) => i.status === "attention").length;
  const problemCount = allItems.filter((i) => i.status === "problem").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-border text-text-secondary hover:text-text-primary transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Review Laporan
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {order?.order_number} · {order?.vehicle.brand} {order?.vehicle.model}
            </p>
          </div>
        </div>
        <button
          onClick={handleSaveReview}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 bg-success hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm text-sm disabled:opacity-60"
        >
          {isSubmitting ? (
            "Menyimpan..."
          ) : (
            <>
              <Save className="w-4 h-4" />
              Selesaikan & Submit
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-danger-bg border border-red-200 text-danger text-sm rounded-xl p-4 flex items-center gap-3 animate-slide-in-down">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in delay-1 opacity-0">
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{allItems.length}</p>
          <p className="text-xs text-text-tertiary mt-1">Total Item</p>
        </div>
        <div className="bg-success-bg rounded-xl border border-green-200 p-4 text-center">
          <p className="text-2xl font-bold text-success">{okCount}</p>
          <p className="text-xs text-success/70 mt-1">OK</p>
        </div>
        <div className="bg-warning-bg rounded-xl border border-amber-200 p-4 text-center">
          <p className="text-2xl font-bold text-warning">{attentionCount}</p>
          <p className="text-xs text-warning/70 mt-1">Perhatian</p>
        </div>
        <div className="bg-danger-bg rounded-xl border border-red-200 p-4 text-center">
          <p className="text-2xl font-bold text-danger">{problemCount}</p>
          <p className="text-xs text-danger/70 mt-1">Bermasalah</p>
        </div>
      </div>

      {/* Score & Summary Input */}
      <div className="bg-white rounded-2xl border border-border shadow-xs animate-fade-in delay-2 opacity-0">
        <div className="px-6 py-4 border-b border-border-light">
          <h2 className="text-base font-semibold text-text-primary">
            Skor & Ringkasan Laporan
          </h2>
        </div>
        <div className="p-6 space-y-5">
          {/* Score */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Skor Penilaian Keseluruhan Mobil
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="flex-1 accent-accent cursor-pointer"
              />
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl text-white flex-shrink-0 ${
                  score >= 80
                    ? "bg-success"
                    : score >= 60
                    ? "bg-warning"
                    : "bg-danger"
                }`}
              >
                {score}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Ringkasan Temuan Inspeksi <span className="text-danger">*</span>
            </label>
            <textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Berikan ringkasan detail mengenai kondisi umum mobil dan temuan-temuan penting..."
              className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all resize-none"
            />
          </div>

          {/* Recommendation */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Rekomendasi Pembelian & Perbaikan <span className="text-danger">*</span>
            </label>
            <textarea
              rows={3}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder="Berikan saran kelayakan beli serta estimasi biaya perbaikan komponen bermasalah..."
              className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Inspection Categories & Titik Pemeriksaan */}
      <div className="space-y-3 animate-fade-in delay-3 opacity-0">
        <h3 className="text-base font-bold text-text-primary px-1">
          Rincian Hasil Cek Lapangan
        </h3>
        {categories.map((category) => {
          const isExpanded = expandedCategories.includes(category.id);
          const catItems = category.items || [];
          const catOk = catItems.filter((i) => i.status === "ok").length;
          const catIssues = catItems.filter(
            (i) => i.status === "attention" || i.status === "problem"
          ).length;

          return (
            <div
              key={category.id}
              className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden"
            >
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-surface-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-bold text-text-primary">
                    {category.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold bg-success-bg text-success px-2 py-0.5 rounded-full">
                      {catOk} OK
                    </span>
                    {catIssues > 0 && (
                      <span className="text-[10px] font-semibold bg-warning-bg text-warning px-2 py-0.5 rounded-full">
                        {catIssues} Isu
                      </span>
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border-light divide-y divide-border-light bg-slate-50/30">
                  {catItems.map((item) => {
                    const status = statusIcons[item.status] || statusIcons.na;
                    const StatusIcon = status.icon;
                    const severity = item.severity
                      ? severityConfig[item.severity]
                      : null;

                    return (
                      <div key={item.id} className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${status.bg}`}
                          >
                            <StatusIcon className={`w-4 h-4 ${status.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-text-primary">
                                {item.name}
                              </p>
                              {severity && (
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${severity.bg} ${severity.color}`}
                                >
                                  {severity.label}
                                </span>
                              )}
                            </div>
                            {item.notes ? (
                              <p className="text-xs text-text-secondary mt-1.5 flex items-start gap-1.5 bg-white p-2.5 border rounded-lg max-w-2xl">
                                <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-text-tertiary" />
                                {item.notes}
                              </p>
                            ) : (
                              <p className="text-xs text-text-tertiary mt-1 italic">Tidak ada catatan temuan.</p>
                            )}
                            {item.photos && item.photos.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <Camera className="w-3.5 h-3.5 text-text-tertiary" />
                                <span className="text-xs text-text-tertiary">
                                  {item.photos.length} foto temuan terlampir
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
