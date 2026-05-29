"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  AlertCircle,
  Layers,
  CheckSquare,
  GripVertical,
} from "lucide-react";

interface Item {
  name: string;
  description: string;
  photo_required: boolean;
}

interface Category {
  name: string;
  items: Item[];
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>([
    {
      name: "Eksterior",
      items: [
        { name: "Body depan", description: "Cek penyok dan goresan", photo_required: true },
      ],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // States for Drag & Drop
  const [draggedCatIdx, setDraggedCatIdx] = useState<number | null>(null);
  const [draggedItemCoords, setDraggedItemCoords] = useState<{ catIdx: number; itemIdx: number } | null>(null);

  const addCategory = () => {
    setCategories([...categories, { name: "", items: [] }]);
  };

  const removeCategory = (catIdx: number) => {
    setCategories(categories.filter((_, idx) => idx !== catIdx));
  };

  const handleCategoryNameChange = (catIdx: number, val: string) => {
    const updated = [...categories];
    updated[catIdx].name = val;
    setCategories(updated);
  };

  const addItem = (catIdx: number) => {
    const updated = [...categories];
    updated[catIdx].items.push({
      name: "",
      description: "",
      photo_required: true,
    });
    setCategories(updated);
  };

  const removeItem = (catIdx: number, itemIdx: number) => {
    const updated = [...categories];
    updated[catIdx].items = updated[catIdx].items.filter((_, idx) => idx !== itemIdx);
    setCategories(updated);
  };

  const handleItemChange = (catIdx: number, itemIdx: number, key: keyof Item, val: any) => {
    const updated = [...categories];
    updated[catIdx].items[itemIdx] = {
      ...updated[catIdx].items[itemIdx],
      [key]: val,
    };
    setCategories(updated);
  };

  // Drag & Drop: susun ulang langsung saat hover agar terasa mulus.
  const resetDrag = () => {
    setDraggedCatIdx(null);
    setDraggedItemCoords(null);
  };

  const handleCatDragStart = (idx: number) => {
    setDraggedCatIdx(idx);
  };

  const handleCatDragOver = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedCatIdx === null || draggedCatIdx === targetIdx) return;
    setCategories((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(draggedCatIdx, 1);
      updated.splice(targetIdx, 0, moved);
      return updated;
    });
    setDraggedCatIdx(targetIdx);
  };

  const handleItemDragStart = (catIdx: number, itemIdx: number) => {
    setDraggedItemCoords({ catIdx, itemIdx });
  };

  const handleItemDragOver = (
    e: React.DragEvent,
    targetCatIdx: number,
    targetItemIdx: number
  ) => {
    e.preventDefault();
    if (!draggedItemCoords) return;
    const { catIdx: sc, itemIdx: si } = draggedItemCoords;
    if (sc === targetCatIdx && si === targetItemIdx) return;
    setCategories((prev) => {
      const updated = prev.map((c) => ({ ...c, items: [...c.items] }));
      const [moved] = updated[sc].items.splice(si, 1);
      const insertAt = Math.min(targetItemIdx, updated[targetCatIdx].items.length);
      updated[targetCatIdx].items.splice(insertAt, 0, moved);
      return updated;
    });
    setDraggedItemCoords({ catIdx: targetCatIdx, itemIdx: targetItemIdx });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Nama template wajib diisi");
      return;
    }

    // Merge categories with empty/blank names into "Tanpa Kategori"
    let mergedCategories: Category[] = [];
    let tanpaKategoriItems: Item[] = [];

    for (const cat of categories) {
      if (!cat.name.trim()) {
        tanpaKategoriItems.push(...cat.items);
      } else {
        mergedCategories.push({
          ...cat,
          items: [...cat.items],
        });
      }
    }

    if (tanpaKategoriItems.length > 0) {
      const existingIdx = mergedCategories.findIndex(
        (c) => c.name.trim().toLowerCase() === "tanpa kategori"
      );
      if (existingIdx !== -1) {
        mergedCategories[existingIdx].items.push(...tanpaKategoriItems);
      } else {
        mergedCategories.push({
          name: "Tanpa Kategori",
          items: tanpaKategoriItems,
        });
      }
    }

    const totalItems = mergedCategories.reduce((sum, cat) => sum + cat.items.length, 0);
    if (totalItems === 0) {
      setError("Template wajib memiliki minimal 1 item inspeksi");
      return;
    }

    // Validate remaining categories and items
    for (const cat of mergedCategories) {
      if (cat.items.length === 0) {
        setError(`Kategori "${cat.name}" wajib memiliki minimal 1 item inspeksi`);
        return;
      }
      for (const [iIdx, item] of cat.items.entries()) {
        if (!item.name.trim()) {
          setError(`Kategori "${cat.name}": Titik Pemeriksaan ke-${iIdx + 1} wajib diisi namanya`);
          return;
        }
      }
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          categories: mergedCategories.map((cat, catIdx) => ({
            name: cat.name,
            order: catIdx + 1,
            items: cat.items.map((item, itemIdx) => ({
              name: item.name,
              description: item.description || undefined,
              photo_required: item.photo_required,
              order: itemIdx + 1,
            })),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan template");

      router.push("/admin/templates");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal menghubungkan ke server");
    } finally {
      setIsLoading(false);
    }
  };

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
              Buat Template Baru
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Tentukan kategori dan item titik pemeriksaan mobil
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? "Menyimpan..." : "Simpan Template"}
        </button>
      </div>

      {error && (
        <div className="bg-danger-bg border border-red-200 text-danger text-sm rounded-xl p-4 flex items-center gap-3 animate-slide-in-down">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Template Info Card */}
      <div className="bg-white rounded-2xl border border-border shadow-xs p-6 space-y-4 animate-fade-in delay-1 opacity-0">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Nama Template <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Inspeksi Mobil Bekas Standar"
            className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Deskripsi
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi singkat tentang template ini untuk mempermudah admin memilih."
            className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm resize-none"
          />
        </div>
      </div>

      {/* Categories Builder */}
      <div className="space-y-6 animate-fade-in delay-2 opacity-0">
        <div className="flex items-center justify-between border-b border-border-light pb-2">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            Susunan Kategori & Item Checklist
          </h2>
          <button
            onClick={addCategory}
            className="inline-flex items-center gap-1.5 text-accent hover:text-accent-dark text-xs font-semibold bg-accent/5 hover:bg-accent/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Kategori
          </button>
        </div>

        {categories.map((cat, catIdx) => (
          <div
            key={catIdx}
            draggable
            onDragStart={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest("input") || target.closest("button") || target.closest("textarea") || target.closest("select")) {
                e.preventDefault();
                return;
              }
              handleCatDragStart(catIdx);
            }}
            onDragOver={(e) => handleCatDragOver(e, catIdx)}
            onDrop={(e) => {
              e.preventDefault();
              resetDrag();
            }}
            onDragEnd={resetDrag}
            className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all duration-150 ${
              draggedCatIdx === catIdx
                ? "border-accent ring-2 ring-accent/30 shadow-lg select-none"
                : "border-border"
            }`}
          >
            {/* Category Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-border-light">
              <div className="flex-1 flex items-center gap-3 max-w-md">
                <GripVertical className="w-4 h-4 text-text-tertiary cursor-grab active:cursor-grabbing flex-shrink-0" />
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => handleCategoryNameChange(catIdx, e.target.value)}
                  placeholder="Nama Kategori (Kosongkan untuk kategori 'Tanpa Kategori')"
                  className="w-full px-3 py-1.5 bg-white border border-border rounded-lg text-text-primary font-bold text-sm focus:border-accent focus:ring-1 focus:ring-accent/10 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => addItem(catIdx)}
                  className="inline-flex items-center gap-1 text-primary hover:text-primary-dark text-xs font-semibold bg-white border border-border px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  Pemeriksaan
                </button>
                <button
                  type="button"
                  onClick={() => removeCategory(catIdx)}
                  className="text-text-tertiary hover:text-danger cursor-pointer p-1 rounded transition-colors"
                  title="Hapus Kategori"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Items */}
            <div className="p-6 divide-y divide-border-light space-y-4 divide-y-reverse">
              {cat.items.length === 0 ? (
                <div
                  onDragOver={(e) => {
                    e.stopPropagation();
                    handleItemDragOver(e, catIdx, 0);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    resetDrag();
                  }}
                  className="text-xs text-text-tertiary text-center py-6 border border-dashed border-border rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  Belum ada titik pemeriksaan di kategori ini. Tarik pemeriksaan ke sini atau klik "+ Pemeriksaan" di atas.
                </div>
              ) : (
                cat.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    draggable
                    onDragStart={(e) => {
                      const target = e.target as HTMLElement;
                      if (
                        target.closest("input") ||
                        target.closest("button") ||
                        target.closest("textarea") ||
                        target.closest("[type='checkbox']")
                      ) {
                        e.preventDefault();
                        return;
                      }
                      e.stopPropagation();
                      handleItemDragStart(catIdx, itemIdx);
                    }}
                    onDragOver={(e) => {
                      e.stopPropagation();
                      handleItemDragOver(e, catIdx, itemIdx);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      resetDrag();
                    }}
                    onDragEnd={(e) => {
                      e.stopPropagation();
                      resetDrag();
                    }}
                    className={`pt-4 first:pt-0 flex flex-col md:flex-row gap-4 items-start transition-all duration-150 ${
                      draggedItemCoords?.catIdx === catIdx && draggedItemCoords?.itemIdx === itemIdx
                        ? "bg-accent/5 ring-2 ring-accent/40 rounded-xl shadow-sm p-2 select-none"
                        : ""
                    }`}
                  >
                    <div className="pt-2.5 hidden md:block">
                      <GripVertical className="w-3.5 h-3.5 text-text-tertiary cursor-grab active:cursor-grabbing flex-shrink-0" />
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                          Nama Titik Pemeriksaan <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={item.name}
                          onChange={(e) => handleItemChange(catIdx, itemIdx, "name", e.target.value)}
                          placeholder="Contoh: Kondisi Ban & Velg"
                          className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary focus:border-accent focus:bg-white focus:ring-1 focus:ring-accent/10 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1">
                          Keterangan / Petunjuk Pengisian
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(catIdx, itemIdx, "description", e.target.value)}
                          placeholder="Contoh: Cek kedalaman kembang ban"
                          className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs text-text-primary focus:border-accent focus:bg-white focus:ring-1 focus:ring-accent/10 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-1.5 md:pt-6 w-full md:w-auto justify-between md:justify-start">
                      <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.photo_required}
                          onChange={(e) => handleItemChange(catIdx, itemIdx, "photo_required", e.target.checked)}
                          className="w-3.5 h-3.5 accent-accent cursor-pointer"
                        />
                        Wajib Foto
                      </label>
                      <button
                        type="button"
                        onClick={() => removeItem(catIdx, itemIdx)}
                        className="text-text-tertiary hover:text-danger cursor-pointer p-1 transition-colors"
                        title="Hapus Titik Pemeriksaan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
