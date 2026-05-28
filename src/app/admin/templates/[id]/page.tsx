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

  const handleSave = async (archiveVal?: boolean) => {
    const nextArchiveState = archiveVal !== undefined ? archiveVal : isArchived;

    if (!name.trim()) {
      setError("Nama template wajib diisi");
      return;
    }

    if (categories.length === 0) {
      setError("Wajib menambahkan minimal 1 kategori");
      return;
    }

    for (const [cIdx, cat] of categories.entries()) {
      if (!cat.name.trim()) {
        setError(`Nama Kategori ke-${cIdx + 1} tidak boleh kosong`);
        return;
      }
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
          categories: categories.map((cat, catIdx) => ({
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
                className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-border-light">
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      required
                      value={cat.name}
                      onChange={(e) => handleCategoryNameChange(catIdx, e.target.value)}
                      placeholder="Nama Kategori (contoh: Eksterior, Interior)"
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
                    <p className="text-xs text-text-tertiary text-center py-4">
                      Belum ada titik pemeriksaan di kategori ini. Klik "Pemeriksaan" di atas untuk menambahkan.
                    </p>
                  ) : (
                    cat.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="pt-4 first:pt-0 flex flex-col md:flex-row gap-4 items-start">
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
    </div>
  );
}
