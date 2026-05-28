"use client";

import { useState, use, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Minus,
  Camera,
  Plus,
  MessageSquare,
  WifiOff,
  Save,
  X,
  ImageIcon,
} from "lucide-react";
import type { ChecklistStatus, Severity } from "@/lib/types";
import { getOfflineOrderDetail, saveOfflineOrderDetail, queueOfflineUpdate } from "@/lib/offline-db";
import { TopProgressBar, ChecklistSkeleton } from "@/lib/ui";
import { compressImage } from "@/lib/image-compress";

const statusOptions: { value: ChecklistStatus; icon: typeof CheckCircle2; label: string; color: string; bg: string; activeBg: string }[] = [
  { value: "ok", icon: CheckCircle2, label: "OK", color: "text-success", bg: "bg-success-bg", activeBg: "bg-success text-white" },
  { value: "attention", icon: AlertTriangle, label: "Perhatian", color: "text-warning", bg: "bg-warning-bg", activeBg: "bg-warning text-white" },
  { value: "problem", icon: XCircle, label: "Masalah", color: "text-danger", bg: "bg-danger-bg", activeBg: "bg-danger text-white" },
  { value: "na", icon: Minus, label: "N/A", color: "text-text-tertiary", bg: "bg-surface-tertiary", activeBg: "bg-slate-500 text-white" },
];

const severityOptions: { value: Severity; label: string; color: string; activeBg: string }[] = [
  { value: "ringan", label: "Ringan", color: "text-amber-600", activeBg: "bg-amber-500 text-white" },
  { value: "sedang", label: "Sedang", color: "text-orange-600", activeBg: "bg-orange-500 text-white" },
  { value: "berat", label: "Berat", color: "text-red-600", activeBg: "bg-red-600 text-white" },
];

interface ItemState {
  id: string;
  status: ChecklistStatus | null;
  severity: Severity | null;
  notes: string;
  photos: string[];
  is_answered: boolean;
}

export default function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState(0);
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingLabel, setSavingLabel] = useState("Menyimpan...");
  const [isOffline, setIsOffline] = useState(false);
  const [highlightEmpty, setHighlightEmpty] = useState(false);
  const [showIncompleteModal, setShowIncompleteModal] = useState(false);
  const [pendingNavUrl, setPendingNavUrl] = useState<string | null>(null);
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [addingItem, setAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const loadOrderData = async () => {
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
        const checklistCategories = orderData.checklist || [];
        setCategories(checklistCategories);

        const initialStates: Record<string, ItemState> = {};
        checklistCategories.forEach((cat: any) => {
          cat.items.forEach((item: any) => {
            const validStatus =
              item.status === "ok" ||
              item.status === "attention" ||
              item.status === "problem" ||
              item.status === "na"
                ? item.status
                : null;
            initialStates[item.id] = {
              id: item.id,
              status: validStatus,
              severity: item.severity || null,
              notes: item.notes || "",
              photos: item.photos || [],
              is_answered: item.is_answered === true || validStatus !== null,
            };
          });
        });
        setItemStates(initialStates);
      }
    } catch (e) {
      console.error("Gagal memuat checklist:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [id]);

  const getItemState = (itemId: string): ItemState =>
    itemStates[itemId] || { id: itemId, status: null, severity: null, notes: "", photos: [], is_answered: false };

  const updateItemState = (itemId: string, updates: Partial<ItemState>) => {
    setItemStates((prev) => {
      const current = prev[itemId] || { id: itemId, status: null, severity: null, notes: "", photos: [], is_answered: false };
      const next = { ...current, ...updates };
      // Auto-tandai sebagai answered jika status ada
      if (next.status != null) next.is_answered = true;
      return { ...prev, [itemId]: next };
    });
  };

  const buildChecklistUpdates = () =>
    Object.values(itemStates).map((s) => ({
      id: s.id,
      status: s.status,
      severity: s.severity,
      notes: s.notes,
      photos: s.photos,
      is_answered: s.is_answered,
    }));

  const handleSaveProgress = async (nextStepUrl?: string, label = "Menyimpan...") => {
    if (!order) return;
    setSaving(true);
    setSavingLabel(label);

    const checklistUpdates = buildChecklistUpdates();

    try {
      if (navigator.onLine) {
        const res = await fetch(`/api/admin/orders/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checklist: checklistUpdates }),
        });

        if (res.ok) {
          const updatedChecklist = categories.map((cat) => ({
            ...cat,
            items: cat.items.map((item: any) => {
              const state = itemStates[item.id];
              return state ? { ...item, ...state } : item;
            }),
          }));
          const updatedOrder = { ...order, checklist: updatedChecklist };
          await saveOfflineOrderDetail(id, updatedOrder);
          if (nextStepUrl) router.push(nextStepUrl);
          return;
        }
      }
      await queueOfflineUpdate(id, { checklist: checklistUpdates });
      if (nextStepUrl) router.push(nextStepUrl);
    } catch (err) {
      console.error("Gagal menyimpan progress checklist:", err);
      await queueOfflineUpdate(id, { checklist: checklistUpdates });
      if (nextStepUrl) router.push(nextStepUrl);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async (itemId: string, file: File) => {
    setUploadingItem(itemId);
    setUploadProgress(5);

    try {
      const compressed = await compressImage(file);
      setUploadProgress(10);

      const form = new FormData();
      form.append("file", compressed);
      form.append("orderId", id);
      form.append("itemId", itemId);

      // Pakai XHR untuk dapat progress event
      const url: string = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/inspector/upload");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 90);
            setUploadProgress(Math.max(10, pct));
          }
        };
        xhr.onload = () => {
          setUploadProgress(95);
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && data.success && data.url) {
              resolve(data.url);
            } else {
              reject(new Error(data.error || "Gagal upload"));
            }
          } catch (e) {
            reject(e);
          }
        };
        xhr.onerror = () => reject(new Error("Koneksi gagal"));
        xhr.send(form);
      });

      const state = getItemState(itemId);
      updateItemState(itemId, { photos: [...state.photos, url] });
      setUploadProgress(100);
    } catch (err: any) {
      alert(`Upload foto gagal: ${err.message || err}`);
    } finally {
      setTimeout(() => {
        setUploadingItem(null);
        setUploadProgress(0);
      }, 250);
    }
  };

  const handleRemovePhoto = (itemId: string, photoUrl: string) => {
    const state = getItemState(itemId);
    updateItemState(itemId, { photos: state.photos.filter((p) => p !== photoUrl) });
  };

  const handleAddItem = async () => {
    if (!newItemName.trim() || !currentCategory) return;
    setAddingItem(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: currentCategory.id,
          category_name: currentCategory.name,
          item_name: newItemName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menambah item");
      }
      // Tambahkan item ke state
      setCategories((prev) =>
        prev.map((cat, idx) =>
          idx === activeCategory
            ? { ...cat, items: [...cat.items, data.item] }
            : cat
        )
      );
      setItemStates((prev) => ({
        ...prev,
        [data.item.id]: {
          id: data.item.id,
          status: null,
          severity: null,
          notes: "",
          photos: [],
          is_answered: false,
        },
      }));
      setNewItemName("");
      setShowAddInput(false);
    } catch (err: any) {
      alert(`Gagal menambah item: ${err.message || err}`);
    } finally {
      setAddingItem(false);
    }
  };

  const handleGoToSummary = async () => {
    if (filledItems < totalItems) {
      setHighlightEmpty(true);
      setShowIncompleteModal(true);
      setPendingNavUrl(`/inspector/orders/${id}/inspect/summary`);
      // scroll ke item kosong pertama di kategori aktif
      const firstEmpty = currentCategory?.items.find((it: any) => !itemStates[it.id]?.is_answered);
      if (firstEmpty && itemRefs.current[firstEmpty.id]) {
        itemRefs.current[firstEmpty.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    await handleSaveProgress(`/inspector/orders/${id}/inspect/summary`, "Memproses ringkasan...");
  };

  const currentCategory = categories[activeCategory];
  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);
  const filledItems = Object.values(itemStates).filter((s) => s.is_answered).length;
  const progress = totalItems > 0 ? Math.round((filledItems / totalItems) * 100) : 0;

  if (loading) {
    return <ChecklistSkeleton />;
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

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col pb-24">
      <TopProgressBar
        active={saving || uploadingItem !== null}
        value={uploadingItem !== null ? uploadProgress : undefined}
        label={uploadingItem !== null ? "Mengunggah foto..." : savingLabel}
      />

      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-primary-dark text-white shadow-md">
        <div className="px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => handleSaveProgress(`/inspector/orders/${id}`)}
            className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Checklist Inspeksi</p>
              {isOffline && <WifiOff className="w-3.5 h-3.5 text-amber-500" />}
            </div>
            <p className="text-[10px] text-white/60">
              {order.vehicle.brand} {order.vehicle.model} · {order.vehicle.plate_number}
            </p>
          </div>
          <button
            onClick={() => handleSaveProgress()}
            disabled={saving}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-white disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold cursor-pointer mr-1"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Simpan..." : "Simpan"}
          </button>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full flex-shrink-0">
            Step 2/3
          </span>
        </div>

        {/* Progress */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-[10px] text-white/60 mb-1">
            <span>{filledItems} dari {totalItems} item terisi</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto gap-1 px-4 pb-3 scrollbar-none">
          {categories.map((cat, i) => {
            const catFilled = cat.items.filter(
              (item: any) => itemStates[item.id]?.is_answered
            ).length;
            const catComplete = catFilled === cat.items.length && cat.items.length > 0;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  handleSaveProgress();
                  setActiveCategory(i);
                  setHighlightEmpty(false);
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  i === activeCategory
                    ? "bg-white text-primary-dark"
                    : catComplete
                    ? "bg-success/30 text-white/90"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {cat.name}
                <span className="opacity-60">
                  {catFilled}/{cat.items.length}
                </span>
                {catComplete && <CheckCircle2 className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 px-4 py-4 max-w-lg mx-auto w-full space-y-3">
        {currentCategory?.items.map((item: any) => {
          const state = getItemState(item.id);
          const isExpanded = expandedItem === item.id;
          const isEmpty = !state.is_answered;
          const shouldHighlight = highlightEmpty && isEmpty;

          return (
            <div
              key={item.id}
              ref={(el) => {
                itemRefs.current[item.id] = el;
              }}
              className={`bg-white rounded-2xl border shadow-xs overflow-hidden animate-fade-in transition-all ${
                shouldHighlight
                  ? "border-warning ring-2 ring-warning/30"
                  : isEmpty
                  ? "border-border"
                  : "border-success/30"
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      {item.name}
                      {isEmpty && (
                        <span className="text-[9px] uppercase tracking-wide font-bold text-warning bg-warning-bg px-1.5 py-0.5 rounded">
                          belum
                        </span>
                      )}
                    </p>
                    {item.description && (
                      <p className="text-xs text-text-secondary mt-0.5">{item.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.photo_required && (
                      <span className="text-[10px] bg-primary/5 text-primary px-1.5 py-0.5 rounded font-medium">
                        Foto Wajib
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Buttons */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {statusOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = state.status === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() =>
                          updateItemState(item.id, {
                            status: isSelected ? null : opt.value,
                            severity:
                              opt.value !== "attention" && opt.value !== "problem"
                                ? null
                                : state.severity,
                            is_answered: isSelected ? false : true,
                          })
                        }
                        className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                          isSelected ? opt.activeBg : `${opt.bg} ${opt.color}`
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {(state.status === "attention" || state.status === "problem") &&
                  item.severity_required && (
                    <div className="mt-3 pt-3 border-t border-border-light">
                      <p className="text-xs text-text-secondary mb-2">Tingkat Kerusakan:</p>
                      <div className="flex gap-2">
                        {severityOptions.map((sev) => (
                          <button
                            key={sev.value}
                            onClick={() =>
                              updateItemState(item.id, {
                                severity: state.severity === sev.value ? null : sev.value,
                              })
                            }
                            className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                              state.severity === sev.value
                                ? sev.activeBg
                                : `bg-surface-secondary ${sev.color} border border-border`
                            }`}
                          >
                            {sev.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Photo Thumbnails */}
                {state.photos.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
                    {state.photos.map((p, idx) => (
                      <div key={idx} className="relative flex-shrink-0 group">
                        <img
                          src={p}
                          alt="Foto"
                          className="w-16 h-16 rounded-xl object-cover border border-border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTIxIDE1bC01LTUtNyA3LTQtNCIvPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiLz48L3N2Zz4=";
                          }}
                        />
                        <button
                          onClick={() => handleRemovePhoto(item.id, p)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center shadow-md cursor-pointer"
                          aria-label="Hapus foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action bar */}
                <div className="flex items-center gap-2 mt-3">
                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-secondary text-xs text-text-secondary hover:bg-surface-tertiary transition-colors cursor-pointer">
                    <Camera className="w-3.5 h-3.5" />
                    {state.photos.length > 0 ? `${state.photos.length} Foto` : "Foto"}
                    <Plus className="w-3 h-3" />
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      disabled={uploadingItem !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadPhoto(item.id, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      state.notes
                        ? "bg-info-bg text-info"
                        : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {state.notes ? "Edit Catatan" : "Catatan"}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 animate-slide-in-up">
                    <textarea
                      rows={2}
                      value={state.notes}
                      onChange={(e) => updateItemState(item.id, { notes: e.target.value })}
                      placeholder="Tulis catatan temuan..."
                      className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all resize-none"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Tambah Item Ad-hoc */}
        {currentCategory && (
          <div className="bg-white rounded-2xl border border-dashed border-border p-3 animate-fade-in">
            {showAddInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={`Item baru di ${currentCategory.name}...`}
                  className="flex-1 px-3 py-2 bg-surface-secondary border border-border rounded-xl text-sm focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none"
                  autoFocus
                  disabled={addingItem}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddItem();
                    if (e.key === "Escape") {
                      setShowAddInput(false);
                      setNewItemName("");
                    }
                  }}
                />
                <button
                  onClick={handleAddItem}
                  disabled={addingItem || !newItemName.trim()}
                  className="px-3 py-2 bg-accent text-white rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {addingItem ? "..." : "Tambah"}
                </button>
                <button
                  onClick={() => {
                    setShowAddInput(false);
                    setNewItemName("");
                  }}
                  disabled={addingItem}
                  className="px-2 py-2 text-text-secondary cursor-pointer"
                  aria-label="Batal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddInput(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-text-secondary hover:text-accent transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah item di kategori ini
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 bg-white border-t border-border px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          {activeCategory > 0 ? (
            <button
              onClick={() => {
                handleSaveProgress();
                setActiveCategory((prev) => prev - 1);
                setHighlightEmpty(false);
              }}
              className="px-4 py-3 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors cursor-pointer"
            >
              Sebelumnya
            </button>
          ) : (
            <button
              onClick={() => handleSaveProgress(`/inspector/orders/${id}/inspect`)}
              className="px-4 py-3 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors cursor-pointer"
            >
              Data Mobil
            </button>
          )}

          {activeCategory < categories.length - 1 ? (
            <button
              onClick={() => {
                handleSaveProgress();
                setActiveCategory((prev) => prev + 1);
                setHighlightEmpty(false);
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold py-3 rounded-xl transition-all cursor-pointer active:scale-[0.98] text-sm"
            >
              {categories[activeCategory + 1]?.name}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGoToSummary}
              className="flex-1 flex items-center justify-center gap-2 bg-success hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all cursor-pointer active:scale-[0.98] text-sm"
            >
              Ke Ringkasan
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Modal: Peringatan item belum lengkap */}
      {showIncompleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-slide-in-up">
            <div className="w-12 h-12 bg-warning-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <h3 className="text-base font-bold text-text-primary text-center">
              {totalItems - filledItems} item belum diisi
            </h3>
            <p className="text-sm text-text-secondary text-center mt-1">
              Lebih baik isi semua item sebelum lanjut ke ringkasan. Item yang belum diisi sudah ditandai berwarna kuning.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowIncompleteModal(false)}
                className="flex-1 py-3 border border-border rounded-xl text-sm font-medium text-text-secondary cursor-pointer"
              >
                Lengkapi
              </button>
              <button
                onClick={async () => {
                  setShowIncompleteModal(false);
                  if (pendingNavUrl) {
                    await handleSaveProgress(pendingNavUrl, "Memproses ringkasan...");
                  }
                }}
                className="flex-1 py-3 bg-warning hover:bg-amber-600 text-white rounded-xl text-sm font-semibold cursor-pointer"
              >
                Tetap Lanjut
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
