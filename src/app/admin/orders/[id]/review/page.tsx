"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Minus,
  Camera,
  AlertCircle,
  Save,
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  ImageIcon,
  Car,
  Pencil,
  Search,
} from "lucide-react";
import { GRADES, scoreToGrade, gradeToScore } from "@/lib/grade";

const STATUS_OPTIONS: { value: "ok" | "attention" | "problem" | "na"; label: string; color: string; bg: string; ring: string }[] = [
  { value: "ok", label: "OK", color: "text-success", bg: "bg-success-bg", ring: "ring-success" },
  { value: "attention", label: "Perhatian", color: "text-warning", bg: "bg-warning-bg", ring: "ring-warning" },
  { value: "problem", label: "Bermasalah", color: "text-danger", bg: "bg-danger-bg", ring: "ring-danger" },
  { value: "na", label: "N/A", color: "text-text-tertiary", bg: "bg-surface-tertiary", ring: "ring-slate-400" },
];

const STATUS_ICON: Record<string, any> = {
  ok: CheckCircle2,
  attention: AlertTriangle,
  problem: XCircle,
  na: Minus,
};

interface InspectionItem {
  id: string;
  name: string;
  status: "ok" | "attention" | "problem" | "na" | null;
  notes?: string;
  photos: string[];
  photo_required?: boolean;
  is_answered?: boolean;
}

interface InspectionCategory {
  id: string;
  name: string;
  items: InspectionItem[];
}

interface Vehicle {
  brand: string;
  model: string;
  type?: string;
  year: number;
  plate_number: string;
  chassis_number?: string;
  engine_number?: string;
  odometer_km: number;
  color: string;
  transmission: string;
  fuel_type: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  client: { name: string };
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

  const [categories, setCategories] = useState<InspectionCategory[]>([]);
  const [score, setScore] = useState(80);
  const [summary, setSummary] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [itemSearch, setItemSearch] = useState("");

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // Modal tambah item
  const [addingCategory, setAddingCategory] = useState<InspectionCategory | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [addingBusy, setAddingBusy] = useState(false);

  // Modal konfirmasi hapus
  const [confirmDelete, setConfirmDelete] = useState<
    | { kind: "item"; categoryId: string; itemId: string; label: string }
    | { kind: "category"; categoryId: string; label: string }
    | null
  >(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  // Foto upload state per item
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<string | null>(null);

  // Modal edit data kendaraan
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<Vehicle | null>(null);
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [vehicleError, setVehicleError] = useState("");

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/admin/orders/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat rincian order");

      const ord = data.order;
      setOrder(ord);
      setCategories(ord.checklist || []);
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

  const updateItem = (categoryId: string, itemId: string, patch: Partial<InspectionItem>) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== categoryId
          ? cat
          : {
              ...cat,
              items: cat.items.map((it) => (it.id !== itemId ? it : { ...it, ...patch })),
            }
      )
    );
  };

  // Kumpulkan payload checklist untuk dikirim ke API PUT order
  const buildChecklistPayload = () =>
    categories.flatMap((cat) =>
      cat.items.map((it) => ({
        id: it.id,
        status: it.status,
        notes: it.notes || "",
        photos: it.photos || [],
        is_answered: it.status != null && it.status !== ("" as any),
      }))
    );

  const persistChanges = async (targetStatus?: string) => {
    setError("");
    setSavedMsg("");

    // 1. Simpan checklist + (opsional) status via PUT order
    const checklistPayload = buildChecklistPayload();
    const orderUpdate: any = { checklist: checklistPayload };
    if (targetStatus) orderUpdate.status = targetStatus;

    const r1 = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderUpdate),
    });
    const d1 = await r1.json();
    if (!r1.ok) throw new Error(d1.error || "Gagal menyimpan checklist");

    // 2. Simpan skor + ringkasan + rekomendasi
    const r2 = await fetch(`/api/admin/orders/${id}/review`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overall_score: score,
        summary,
        recommendation,
        target_status: targetStatus || undefined,
      }),
    });
    const d2 = await r2.json();
    if (!r2.ok) throw new Error(d2.error || "Gagal menyimpan ringkasan laporan");
  };

  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      await persistChanges(); // tidak ubah status
      setSavedMsg("Perubahan berhasil disimpan");
      await fetchOrderDetail();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan perubahan");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleComplete = async () => {
    if (!summary.trim() || !recommendation.trim()) {
      setError("Ringkasan temuan dan rekomendasi wajib diisi sebelum menyelesaikan laporan");
      return;
    }
    try {
      setIsCompleting(true);
      await persistChanges("completed");
      router.push("/admin/orders");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal menyelesaikan laporan");
      setIsCompleting(false);
    }
  };

  // ===== Tambah item =====
  const openAddItem = (category: InspectionCategory) => {
    setAddingCategory(category);
    setNewItemName("");
  };

  const submitAddItem = async () => {
    if (!addingCategory || !newItemName.trim()) return;
    try {
      setAddingBusy(true);
      const res = await fetch(`/api/admin/orders/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: addingCategory.id,
          category_name: addingCategory.name,
          item_name: newItemName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Gagal menambah item");

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id !== addingCategory.id ? cat : { ...cat, items: [...cat.items, data.item] }
        )
      );
      setAddingCategory(null);
      setNewItemName("");
    } catch (err: any) {
      alert(err.message || "Gagal menambah item");
    } finally {
      setAddingBusy(false);
    }
  };

  // ===== Hapus item / kategori =====
  const submitDelete = async () => {
    if (!confirmDelete) return;
    try {
      setDeletingBusy(true);
      const body =
        confirmDelete.kind === "item"
          ? { item_id: confirmDelete.itemId }
          : { category_id: confirmDelete.categoryId };

      const res = await fetch(`/api/admin/orders/${id}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Gagal menghapus");

      if (confirmDelete.kind === "item") {
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id !== confirmDelete.categoryId
              ? cat
              : { ...cat, items: cat.items.filter((it) => it.id !== confirmDelete.itemId) }
          )
        );
      } else {
        setCategories((prev) => prev.filter((cat) => cat.id !== confirmDelete.categoryId));
      }
      setConfirmDelete(null);
    } catch (err: any) {
      alert(err.message || "Gagal menghapus");
    } finally {
      setDeletingBusy(false);
    }
  };

  // ===== Foto =====
  const triggerPhotoUpload = (itemId: string) => {
    uploadTargetRef.current = itemId;
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const itemId = uploadTargetRef.current;
    e.target.value = "";
    if (!file || !itemId) return;

    setUploadingItemId(itemId);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("orderId", id);
      form.append("itemId", itemId);

      const res = await fetch("/api/inspector/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Gagal upload foto");

      // Cari item di categories dan tambahkan url foto
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: cat.items.map((it) =>
            it.id !== itemId ? it : { ...it, photos: [...(it.photos || []), data.url] }
          ),
        }))
      );
    } catch (err: any) {
      alert(err.message || "Gagal upload foto");
    } finally {
      setUploadingItemId(null);
      uploadTargetRef.current = null;
    }
  };

  const openVehicleEditor = () => {
    if (!order) return;
    setVehicleForm({ ...order.vehicle });
    setVehicleError("");
    setShowVehicleModal(true);
  };

  const submitVehicleEdit = async () => {
    if (!vehicleForm) return;
    if (!vehicleForm.brand?.trim() || !vehicleForm.model?.trim() || !vehicleForm.plate_number?.trim()) {
      setVehicleError("Merk, Model, dan Plat Nomor wajib diisi");
      return;
    }
    try {
      setVehicleSaving(true);
      setVehicleError("");
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle: vehicleForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan data kendaraan");
      setShowVehicleModal(false);
      await fetchOrderDetail();
    } catch (err: any) {
      setVehicleError(err.message || "Gagal menghubungkan ke server");
    } finally {
      setVehicleSaving(false);
    }
  };

  const removePhoto = (categoryId: string, itemId: string, photoUrl: string) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id !== categoryId
          ? cat
          : {
              ...cat,
              items: cat.items.map((it) =>
                it.id !== itemId
                  ? it
                  : { ...it, photos: (it.photos || []).filter((p) => p !== photoUrl) }
              ),
            }
      )
    );
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

  const allItems = categories.flatMap((c) => c.items || []);
  const okCount = allItems.filter((i) => i.status === "ok").length;
  const attentionCount = allItems.filter((i) => i.status === "attention").length;
  const problemCount = allItems.filter((i) => i.status === "problem").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Hidden file input untuk upload foto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap animate-fade-in">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-border text-text-secondary hover:text-text-primary transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Edit Laporan Inspeksi
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              {order?.order_number} · {order?.vehicle.brand} {order?.vehicle.model}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isCompleting}
            className="inline-flex items-center gap-2 bg-white border border-border hover:bg-surface-secondary text-text-primary font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs text-sm disabled:opacity-50"
          >
            {isSavingDraft ? (
              "Menyimpan..."
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </>
            )}
          </button>
          <button
            onClick={handleComplete}
            disabled={isSavingDraft || isCompleting}
            className="inline-flex items-center gap-2 bg-success hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm text-sm disabled:opacity-60"
          >
            {isCompleting ? (
              "Menyelesaikan..."
            ) : (
              <>
                <Check className="w-4 h-4" />
                Tandai Selesai
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger-bg border border-red-200 text-danger text-sm rounded-xl p-4 flex items-center gap-3 animate-slide-in-down">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 font-medium">{error}</div>
          <button onClick={() => setError("")} className="text-danger hover:opacity-70 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {savedMsg && (
        <div className="bg-success-bg border border-green-200 text-success text-sm rounded-xl p-4 flex items-center gap-3 animate-slide-in-down">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 font-medium">{savedMsg}</div>
          <button onClick={() => setSavedMsg("")} className="text-success hover:opacity-70 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Data Kendaraan — bisa diedit super admin saat ada koreksi */}
      {order && (
        <div className="bg-white rounded-2xl border border-border shadow-xs">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-text-secondary" />
              <h2 className="text-base font-semibold text-text-primary">Data Kendaraan</h2>
            </div>
            <button
              onClick={openVehicleEditor}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-border hover:bg-surface-secondary text-text-primary text-xs font-semibold cursor-pointer transition-colors"
              title="Edit data kendaraan"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 bg-surface-tertiary rounded-2xl flex items-center justify-center">
                <Car className="w-6 h-6 text-text-secondary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  {order.vehicle.brand} {order.vehicle.model} {order.vehicle.type || ""}
                </h3>
                <p className="text-xs text-text-secondary">
                  {order.vehicle.year} · {order.vehicle.color} ·{" "}
                  {order.vehicle.transmission === "automatic" ? "Otomatis" : "Manual"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Plat Nomor", value: order.vehicle.plate_number },
                {
                  label: "Odometer",
                  value: `${(order.vehicle.odometer_km || 0).toLocaleString("id-ID")} km`,
                },
                { label: "No. Rangka", value: order.vehicle.chassis_number || "Tidak diisi" },
                { label: "No. Mesin", value: order.vehicle.engine_number || "Tidak diisi" },
                {
                  label: "Bahan Bakar",
                  value: order.vehicle.fuel_type === "bensin" ? "Bensin" : order.vehicle.fuel_type,
                },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-text-tertiary uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p className="text-sm font-medium text-text-primary mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

      {/* Skor & Ringkasan */}
      <div className="bg-white rounded-2xl border border-border shadow-xs">
        <div className="px-6 py-4 border-b border-border-light">
          <h2 className="text-base font-semibold text-text-primary">Skor & Ringkasan Laporan</h2>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Grade Penilaian Keseluruhan
            </label>
            <div className="flex items-center gap-4">
              <div className="flex flex-wrap gap-2 flex-1">
                {GRADES.map(({ grade }) => {
                  const active = scoreToGrade(score) === grade;
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setScore(gradeToScore(grade))}
                      className={`min-w-[3.25rem] px-3 py-2.5 rounded-xl font-bold text-sm border transition-all cursor-pointer ${
                        active
                          ? "bg-accent text-white border-accent shadow-sm"
                          : "bg-surface-secondary text-text-secondary border-border hover:border-accent/50 hover:text-text-primary"
                      }`}
                    >
                      {grade}
                    </button>
                  );
                })}
              </div>
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl text-white flex-shrink-0 ${
                  score >= 80 ? "bg-success" : score >= 60 ? "bg-warning" : "bg-danger"
                }`}
              >
                {scoreToGrade(score)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Ringkasan Temuan Inspeksi <span className="text-danger">*</span>
            </label>
            <textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Ringkasan kondisi umum mobil dan temuan-temuan penting..."
              className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Rekomendasi Pembelian & Perbaikan <span className="text-danger">*</span>
            </label>
            <textarea
              rows={3}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              placeholder="Saran kelayakan beli & estimasi biaya perbaikan komponen bermasalah..."
              className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Editor Kategori & Item */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap px-1">
          <h3 className="text-base font-bold text-text-primary">
            Detail Item Pemeriksaan
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder="Cari item inspeksi..."
              className="w-full pl-9 pr-9 py-2 bg-white border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all"
            />
            {itemSearch && (
              <button
                onClick={() => setItemSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        {(() => {
          const normalizedItemSearch = itemSearch.trim().toLowerCase();
          const isItemSearching = normalizedItemSearch.length > 0;
          const matchedCount = isItemSearching
            ? categories.reduce(
                (acc, cat) =>
                  acc +
                  (cat.items || []).filter(
                    (it) =>
                      it.name?.toLowerCase().includes(normalizedItemSearch) ||
                      (it.notes || "").toLowerCase().includes(normalizedItemSearch)
                  ).length,
                0
              )
            : 0;
          if (isItemSearching && matchedCount === 0) {
            return (
              <div className="bg-white rounded-2xl border border-dashed border-border p-8 text-center">
                <Search className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                <p className="text-sm text-text-secondary">Tidak ada item yang cocok</p>
                <p className="text-xs text-text-tertiary mt-1">Coba kata kunci lain.</p>
              </div>
            );
          }
          return categories.map((category) => {
          const catItems = category.items || [];
          const visibleItems = isItemSearching
            ? catItems.filter(
                (it) =>
                  it.name?.toLowerCase().includes(normalizedItemSearch) ||
                  (it.notes || "").toLowerCase().includes(normalizedItemSearch)
              )
            : catItems;
          if (isItemSearching && visibleItems.length === 0) return null;
          const isExpanded = isItemSearching || expandedCategories.includes(category.id);
          const catOk = catItems.filter((i) => i.status === "ok").length;
          const catIssues = catItems.filter(
            (i) => i.status === "attention" || i.status === "problem"
          ).length;

          return (
            <div
              key={category.id}
              className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center gap-3 flex-1 cursor-pointer text-left"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-text-tertiary" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-tertiary" />
                  )}
                  <h4 className="text-sm font-bold text-text-primary">{category.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold bg-success-bg text-success px-2 py-0.5 rounded-full">
                      {catOk} OK
                    </span>
                    {catIssues > 0 && (
                      <span className="text-[10px] font-semibold bg-warning-bg text-warning px-2 py-0.5 rounded-full">
                        {catIssues} Isu
                      </span>
                    )}
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {catItems.length} item
                    </span>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openAddItem(category)}
                    className="p-2 rounded-lg hover:bg-accent/10 text-accent transition-colors cursor-pointer"
                    title="Tambah item ke kategori ini"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setConfirmDelete({
                        kind: "category",
                        categoryId: category.id,
                        label: category.name,
                      })
                    }
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors cursor-pointer"
                    title="Hapus seluruh kategori"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border-light divide-y divide-border-light bg-slate-50/30">
                  {visibleItems.length === 0 && (
                    <div className="px-6 py-8 text-center text-sm text-text-tertiary">
                      Belum ada item di kategori ini.
                    </div>
                  )}
                  {visibleItems.map((item) => {
                    const selectedStatus = item.status;
                    return (
                      <div key={item.id} className="px-6 py-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-text-primary flex-1">
                            {item.name}
                          </p>
                          <button
                            onClick={() =>
                              setConfirmDelete({
                                kind: "item",
                                categoryId: category.id,
                                itemId: item.id,
                                label: item.name,
                              })
                            }
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors cursor-pointer flex-shrink-0"
                            title="Hapus item ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Tombol status */}
                        <div className="grid grid-cols-4 gap-2">
                          {STATUS_OPTIONS.map((s) => {
                            const Icon = STATUS_ICON[s.value];
                            const active = selectedStatus === s.value;
                            return (
                              <button
                                key={s.value}
                                onClick={() =>
                                  updateItem(category.id, item.id, { status: s.value })
                                }
                                className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border transition-all cursor-pointer text-xs font-semibold ${
                                  active
                                    ? `${s.bg} ${s.color} border-transparent ring-2 ${s.ring}`
                                    : "bg-white border-border text-text-secondary hover:bg-surface-secondary"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                {s.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Catatan */}
                        <div>
                          <p className="text-xs font-medium text-text-secondary mb-1.5">
                            Catatan temuan
                          </p>
                          <textarea
                            rows={2}
                            value={item.notes || ""}
                            onChange={(e) =>
                              updateItem(category.id, item.id, { notes: e.target.value })
                            }
                            placeholder="Tuliskan kondisi atau temuan untuk item ini..."
                            className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all resize-none"
                          />
                        </div>

                        {/* Foto */}
                        <div>
                          <p className="text-xs font-medium text-text-secondary mb-1.5">
                            Foto temuan
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {(item.photos || []).map((p, idx) => (
                              <div
                                key={`${p}-${idx}`}
                                className="relative w-16 h-16 rounded-lg overflow-hidden border border-border bg-surface-secondary"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={p}
                                  alt={`Foto ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  onClick={() => removePhoto(category.id, item.id, p)}
                                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer"
                                  title="Hapus foto"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => triggerPhotoUpload(item.id)}
                              disabled={uploadingItemId === item.id}
                              className="w-16 h-16 rounded-lg border-2 border-dashed border-border bg-white hover:bg-accent/5 hover:border-accent text-text-tertiary hover:text-accent flex flex-col items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                              title="Tambah foto"
                            >
                              {uploadingItemId === item.id ? (
                                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-accent" />
                              ) : (
                                <>
                                  <Camera className="w-4 h-4" />
                                  <span className="text-[10px] mt-0.5">Foto</span>
                                </>
                              )}
                            </button>
                          </div>
                          {(!item.photos || item.photos.length === 0) && (
                            <p className="text-xs text-text-tertiary mt-1.5 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              Belum ada foto
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
          });
        })()}

        {categories.length === 0 && (
          <div className="bg-white rounded-2xl border border-border p-8 text-center text-sm text-text-secondary">
            Belum ada kategori inspeksi pada laporan ini.
          </div>
        )}
      </div>

      {/* ===== Modal Tambah Item ===== */}
      {addingCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <h3 className="text-lg font-bold text-text-primary">
                Tambah Item ke {addingCategory.name}
              </h3>
              <button
                onClick={() => setAddingCategory(null)}
                className="p-2 rounded-lg hover:bg-surface-secondary text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <label className="block text-sm font-medium text-text-primary mb-1">
                Nama item baru
              </label>
              <input
                autoFocus
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Contoh: Lampu kabin depan"
                className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newItemName.trim() && !addingBusy) {
                    submitAddItem();
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-border-light bg-surface-secondary/50 rounded-b-2xl">
              <button
                onClick={() => setAddingCategory(null)}
                disabled={addingBusy}
                className="flex-1 px-4 py-2.5 bg-white border border-border hover:bg-surface-secondary text-text-primary font-semibold rounded-xl text-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={submitAddItem}
                disabled={addingBusy || !newItemName.trim()}
                className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl text-sm cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {addingBusy ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Menambah...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Tambah Item
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal Edit Data Kendaraan ===== */}
      {showVehicleModal && vehicleForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">Edit Data Kendaraan</h3>
              </div>
              <button
                onClick={() => setShowVehicleModal(false)}
                disabled={vehicleSaving}
                className="p-2 rounded-lg hover:bg-surface-secondary text-text-tertiary hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Merk *</label>
                  <input
                    value={vehicleForm.brand}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Model *</label>
                  <input
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Tipe</label>
                  <input
                    value={vehicleForm.type || ""}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}
                    placeholder="contoh: AT, MT, Sport"
                    className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Tahun</label>
                  <input
                    type="number"
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Plat Nomor *</label>
                  <input
                    value={vehicleForm.plate_number}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, plate_number: e.target.value.toUpperCase() })}
                    placeholder="B 1234 ABC"
                    className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm font-mono uppercase focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Warna</label>
                  <input
                    value={vehicleForm.color}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Odometer (km)</label>
                  <input
                    type="number"
                    value={vehicleForm.odometer_km}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, odometer_km: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Transmisi</label>
                  <select
                    value={vehicleForm.transmission}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, transmission: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="manual">Manual</option>
                    <option value="automatic">Otomatis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Bahan Bakar</label>
                  <select
                    value={vehicleForm.fuel_type}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, fuel_type: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="bensin">Bensin</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="listrik">Listrik</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">No. Rangka</label>
                  <input
                    value={vehicleForm.chassis_number || ""}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, chassis_number: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm font-mono focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">No. Mesin</label>
                  <input
                    value={vehicleForm.engine_number || ""}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, engine_number: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm font-mono focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  />
                </div>
              </div>

              {vehicleError && (
                <div className="bg-danger-bg border border-red-200 text-danger text-sm rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {vehicleError}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-border-light bg-surface-secondary/50 rounded-b-2xl">
              <button
                onClick={() => setShowVehicleModal(false)}
                disabled={vehicleSaving}
                className="flex-1 px-4 py-2.5 bg-white border border-border hover:bg-surface-secondary text-text-primary font-semibold rounded-xl text-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={submitVehicleEdit}
                disabled={vehicleSaving}
                className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl text-sm cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {vehicleSaving ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Simpan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal Konfirmasi Hapus ===== */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">
                  {confirmDelete.kind === "category" ? "Hapus Kategori?" : "Hapus Item?"}
                </h3>
              </div>
              <button
                onClick={() => setConfirmDelete(null)}
                className="p-2 rounded-lg hover:bg-surface-secondary text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-medium text-text-primary">{confirmDelete.label}</p>
              </div>
              <p className="text-sm text-text-secondary">
                {confirmDelete.kind === "category"
                  ? "Seluruh item & data pemeriksaan dalam kategori ini akan dihapus permanen."
                  : "Item ini beserta status, catatan, dan foto-fotonya akan dihapus permanen."}
              </p>
              <p className="text-sm text-red-600 font-medium">
                ⚠️ Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-border-light bg-surface-secondary/50 rounded-b-2xl">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deletingBusy}
                className="flex-1 px-4 py-2.5 bg-white border border-border hover:bg-surface-secondary text-text-primary font-semibold rounded-xl text-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={submitDelete}
                disabled={deletingBusy}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingBusy ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Ya, Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
