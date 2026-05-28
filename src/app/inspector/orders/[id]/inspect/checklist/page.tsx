"use client";

import { useState, use, useEffect } from "react";
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
} from "lucide-react";
import type { ChecklistStatus, Severity } from "@/lib/types";
import { getOfflineOrderDetail, saveOfflineOrderDetail, queueOfflineUpdate } from "@/lib/offline-db";

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
  id: string; // item_id
  status: ChecklistStatus | null;
  severity: Severity | null;
  notes: string;
  photos: string[];
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
  const [isOffline, setIsOffline] = useState(false);

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
        
        // Checklist categories & items are embedded in the order
        const checklistCategories = orderData.checklist || [];
        setCategories(checklistCategories);

        // Initialize states
        const initialStates: Record<string, ItemState> = {};
        checklistCategories.forEach((cat: any) => {
          cat.items.forEach((item: any) => {
            initialStates[item.id] = {
              id: item.id,
              status: (item.status === "ok" || item.status === "attention" || item.status === "problem" || item.status === "na") ? item.status : null,
              severity: item.severity || null,
              notes: item.notes || "",
              photos: item.photos || [],
            };
          });
        });
        setItemStates(initialStates);
      }
    } catch (e) {
      console.error("Gagal memuat checklist:", e);
      const cached = await getOfflineOrderDetail(id);
      if (cached) {
        setOrder(cached);
        setCategories(cached.checklist || []);
        const initialStates: Record<string, ItemState> = {};
        (cached.checklist || []).forEach((cat: any) => {
          cat.items.forEach((item: any) => {
            initialStates[item.id] = {
              id: item.id,
              status: (item.status === "ok" || item.status === "attention" || item.status === "problem" || item.status === "na") ? item.status : null,
              severity: item.severity || null,
              notes: item.notes || "",
              photos: item.photos || [],
            };
          });
        });
        setItemStates(initialStates);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrderData();
  }, [id]);

  const getItemState = (itemId: string): ItemState =>
    itemStates[itemId] || { id: itemId, status: null, severity: null, notes: "", photos: [] };

  const updateItemState = (itemId: string, updates: Partial<ItemState>) => {
    setItemStates((prev) => ({
      ...prev,
      [itemId]: { ...getItemState(itemId), ...updates },
    }));
  };

  const handleSaveProgress = async (nextStepUrl?: string) => {
    if (!order) return;
    setSaving(true);

    // Format updates array for API
    const checklistUpdates = Object.values(itemStates).map((s) => ({
      id: s.id,
      status: s.status || "na", // fallback
      severity: s.severity,
      notes: s.notes,
      photos: s.photos,
    }));

    try {
      if (navigator.onLine) {
        const res = await fetch(`/api/admin/orders/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            checklist: checklistUpdates,
          }),
        });

        if (res.ok) {
          // Update local cache
          const updatedChecklist = categories.map((cat) => ({
            ...cat,
            items: cat.items.map((item: any) => {
              const state = itemStates[item.id];
              return state ? { ...item, ...state } : item;
            }),
          }));

          const updatedOrder = { ...order, checklist: updatedChecklist };
          await saveOfflineOrderDetail(id, updatedOrder);
          
          if (nextStepUrl) {
            router.push(nextStepUrl);
          }
          return;
        }
      }

      // Offline flow
      await queueOfflineUpdate(id, { checklist: checklistUpdates });
      
      const updatedChecklist = categories.map((cat) => ({
        ...cat,
        items: cat.items.map((item: any) => {
          const state = itemStates[item.id];
          return state ? { ...item, ...state } : item;
        }),
      }));
      const updatedOrder = { ...order, checklist: updatedChecklist };
      await saveOfflineOrderDetail(id, updatedOrder);

      if (nextStepUrl) {
        router.push(nextStepUrl);
      }
    } catch (err) {
      console.error("Gagal menyimpan progress checklist:", err);
      // Offline fallback
      await queueOfflineUpdate(id, { checklist: checklistUpdates });
      if (nextStepUrl) {
        router.push(nextStepUrl);
      }
    } finally {
      setSaving(false);
    }
  };

  const currentCategory = categories[activeCategory];
  const totalItems = categories.reduce((acc, c) => acc + c.items.length, 0);
  const filledItems = Object.values(itemStates).filter((s) => s.status !== null).length;
  const progress = totalItems > 0 ? Math.round((filledItems / totalItems) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <p className="text-sm text-text-secondary">Memuat data checklist...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col pb-24">
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
              {isOffline && (
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              )}
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

        {/* Category Tabs (scrollable) */}
        <div className="flex overflow-x-auto gap-1 px-4 pb-3 scrollbar-none">
          {categories.map((cat, i) => {
            const catFilled = cat.items.filter(
              (item: any) => itemStates[item.id]?.status != null
            ).length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  // Auto save on changing tab
                  handleSaveProgress();
                  setActiveCategory(i);
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  i === activeCategory
                    ? "bg-white text-primary-dark"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {cat.name}
                {catFilled > 0 && (
                  <span className="ml-1 opacity-60">
                    {catFilled}/{cat.items.length}
                  </span>
                )}
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

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden animate-fade-in"
            >
              {/* Item Header */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="text-xs text-text-secondary mt-0.5">
                        {item.description}
                      </p>
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
                            // Clear severity if status is no longer attention or problem
                            severity: (opt.value !== "attention" && opt.value !== "problem") ? null : state.severity,
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

                {/* Severity (if status is attention or problem) */}
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

                {/* Action bar */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => {
                      // Simulasikan tambah foto
                      const newPhotoUrl = `/mock/uploaded-photo-${Date.now()}.jpg`;
                      updateItemState(item.id, {
                        photos: [...state.photos, newPhotoUrl],
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-secondary text-xs text-text-secondary hover:bg-surface-tertiary transition-colors cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {state.photos.length > 0 ? `${state.photos.length} Foto` : "Foto"}
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() =>
                      setExpandedItem(isExpanded ? null : item.id)
                    }
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

                {/* Notes input */}
                {isExpanded && (
                  <div className="mt-3 animate-slide-in-up">
                    <textarea
                      rows={2}
                      value={state.notes}
                      onChange={(e) =>
                        updateItemState(item.id, { notes: e.target.value })
                      }
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
      </div>

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 bg-white border-t border-border px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          {activeCategory > 0 ? (
            <button
              onClick={() => {
                handleSaveProgress();
                setActiveCategory((prev) => prev - 1);
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
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold py-3 rounded-xl transition-all cursor-pointer active:scale-[0.98] text-sm"
            >
              {categories[activeCategory + 1]?.name}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleSaveProgress(`/inspector/orders/${id}/inspect/summary`)}
              className="flex-1 flex items-center justify-center gap-2 bg-success hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all cursor-pointer active:scale-[0.98] text-sm"
            >
              Ke Ringkasan
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

