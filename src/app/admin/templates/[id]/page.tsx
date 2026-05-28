"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Archive,
  Layers,
  AlertCircle,
  RefreshCw,
  GripVertical,
} from "lucide-react";

interface Item {
  id?: string;
  name: string;
  description: string;
  photo_required: boolean;
  severity_required: boolean;
}

interface Category {
  id?: string;
  name: string;
  items: Item[];
}

export default function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isArchived, setIsArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // States for deletion and D&D
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggedCatIdx, setDraggedCatIdx] = useState<number | null>(null);
  const [draggedItemCoords, setDraggedItemCoords] = useState<{ catIdx: number; itemIdx: number } | null>(null);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/admin/templates/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat template");

      const tmpl = data.template;
      setName(tmpl.name);
      setDescription(tmpl.description || "");
      setIsArchived(tmpl.is_archived);
      setCategories(tmpl.categories || []);
    } catch (err: any) {
      setError(err.message || "Gagal menghubungkan ke server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [id]);

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
      severity_required: true,
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

  // Drag & Drop Category Handlers
  const handleCatDragStart = (idx: number) => {
    setDraggedCatIdx(idx);
  };

  const handleCatDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
  };

  const handleCatDrop = (idx: number) => {
    if (draggedCatIdx === null || draggedCatIdx === idx) return;
    const updated = [...categories];
    const draggedCat = updated[draggedCatIdx];
    updated.splice(draggedCatIdx, 1);
    updated.splice(idx, 0, draggedCat);
    setCategories(updated);
    setDraggedCatIdx(null);
  };

  // Drag & Drop Item Handlers
  const handleItemDragStart = (catIdx: number, itemIdx: number) => {
    setDraggedItemCoords({ catIdx, itemIdx });
  };

  const handleItemDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleItemDrop = (targetCatIdx: number, targetItemIdx?: number) => {
    if (!draggedItemCoords) return;
    const { catIdx: sourceCatIdx, itemIdx: sourceItemIdx } = draggedItemCoords;

    if (sourceCatIdx === targetCatIdx && sourceItemIdx === targetItemIdx) {
      setDraggedItemCoords(null);
      return;
    }

    const updated = [...categories];
    const itemToMove = updated[sourceCatIdx].items[sourceItemIdx];

    // Remove from source list
    updated[sourceCatIdx].items.splice(sourceItemIdx, 1);

    // Insert into target list
    if (targetItemIdx !== undefined) {
      updated[targetCatIdx].items.splice(targetItemIdx, 0, itemToMove);
    } else {
      updated[targetCatIdx].items.push(itemToMove);
    }

    setCategories(updated);
    setDraggedItemCoords(null);
  };

  // Delete Handler
  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus template");

      router.push("/admin/templates");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal menghapus template");
      setShowDeleteModal(false);
      // Scroll to top to see error message
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (archiveVal?: boolean) => {
    const nextArchiveState = archiveVal !== undefined ? archiveVal : isArchived;

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
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          is_archived: nextArchiveState,
          categories: mergedCategories.map((cat, catIdx) => ({
            name: cat.name,
            order: catIdx + 1,
            items: cat.items.map((item, itemIdx) => ({
              name: item.name,
              description: item.description || undefined,
              photo_required: item.photo_required,
              severity_required: item.severity_required,
              order: itemIdx + 1,
            })),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui template");

      if (archiveVal !== undefined) {
        setIsArchived(archiveVal);
      }
      router.push("/admin/templates");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal menghubungkan ke server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchiveToggle = () => {
    handleSave(!isArchived);
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
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              {loading ? "Memuat Template..." : `Edit Template: ${name}`}
              {isArchived && (
                <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">
                  Diarsipkan
                </span>
              )}
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Kelola struktur kategori dan titik pengecekan
            </p>
          </div>
        </div>
        {!loading && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={isLoading || isDeleting}
              className="inline-flex items-center gap-1.5 p-2.5 rounded-xl border border-red-200 text-danger hover:bg-danger-bg transition-all cursor-pointer bg-white disabled:opacity-60 text-xs font-semibold"
              title="Hapus Template"
            >
              <Trash2 className="w-4 h-4" />
              Hapus
            </button>
            <button
              onClick={handleArchiveToggle}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 p-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-white transition-all cursor-pointer bg-slate-50 disabled:opacity-60 text-xs font-semibold"
              title={isArchived ? "Aktifkan kembali" : "Arsipkan"}
            >
              <Archive className="w-4 h-4" />
              {isArchived ? "Aktifkan" : "Arsipkan"}
            </button>
            <button
              onClick={() => handleSave()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-danger-bg border border-red-200 text-danger text-sm rounded-xl p-4 flex items-center gap-3 animate-slide-in-down">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 font-medium">{error}</div>
          <button
            onClick={fetchTemplate}
            className="px-3 py-1 bg-white border border-red-200 rounded text-xs cursor-pointer hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-border p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-12 bg-slate-100 rounded w-full" />
          </div>
          <div className="bg-white rounded-2xl border border-border p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/4" />
            <div className="h-20 bg-slate-100 rounded w-full" />
          </div>
        </div>
      )}

      {!loading && (
        <>
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
                placeholder="Deskripsi singkat tentang template ini."
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
                onDrop={() => handleCatDrop(catIdx)}
                className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all duration-200 ${
                  draggedCatIdx === catIdx ? "border-accent/40 opacity-40 scale-[0.99] shadow-inner" : "border-border"
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
                      onDragOver={(e) => handleItemDragOver(e)}
                      onDrop={() => handleItemDrop(catIdx)}
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
                          handleItemDragStart(catIdx, itemIdx);
                        }}
                        onDragOver={(e) => handleItemDragOver(e)}
                        onDrop={(e) => {
                          e.stopPropagation();
                          handleItemDrop(catIdx, itemIdx);
                        }}
                        className={`pt-4 first:pt-0 flex flex-col md:flex-row gap-4 items-start transition-all duration-200 ${
                          draggedItemCoords?.catIdx === catIdx && draggedItemCoords?.itemIdx === itemIdx
                            ? "opacity-35 scale-[0.98] bg-slate-50/50 p-2 rounded-xl border border-dashed border-accent/25"
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
                          <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.severity_required}
                              onChange={(e) => handleItemChange(catIdx, itemIdx, "severity_required", e.target.checked)}
                              className="w-3.5 h-3.5 accent-accent cursor-pointer"
                            />
                            Wajib Severity
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
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-border shadow-xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="w-12 h-12 bg-red-50 text-danger rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                Hapus Template?
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Apakah Anda yakin ingin menghapus template <strong>{name}</strong>? Tindakan ini bersifat permanen dan seluruh kategori serta item pemeriksaan di dalamnya akan ikut terhapus dari sistem.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-text-secondary hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-danger hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-60"
              >
                {isDeleting ? "Menghapus..." : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
