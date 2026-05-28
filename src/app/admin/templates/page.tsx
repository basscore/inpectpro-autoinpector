"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  FileText,
  Archive,
  Layers,
  CheckSquare,
  AlertCircle,
  RefreshCw,
  Trash2,
  Lock,
} from "lucide-react";

interface TemplateItem {
  id: string;
  name: string;
}

interface TemplateCategory {
  id: string;
  name: string;
  items: TemplateItem[];
}

interface Template {
  id: string;
  name: string;
  description?: string;
  is_archived: boolean;
  is_default?: boolean;
  categories: TemplateCategory[];
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  
  // Deletion states
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/templates");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat data");
      setTemplates(data.templates || []);
    } catch (err: any) {
      setError(err.message || "Gagal menghubungkan ke server");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, template: Template) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedTemplate(template);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTemplate) return;
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/templates/${selectedTemplate.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus template");

      setTemplates(templates.filter((t) => t.id !== selectedTemplate.id));
      setShowDeleteModal(false);
      setSelectedTemplate(null);
    } catch (err: any) {
      setError(err.message || "Gagal menghapus template");
      setShowDeleteModal(false);
      setSelectedTemplate(null);
      // Scroll to top to see error message
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const activeTemplates = templates.filter((t) => !t.is_archived);
  const archivedTemplates = templates.filter((t) => t.is_archived);
  const displayedTemplates = showArchived ? templates : activeTemplates;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Template Inspeksi
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {loading ? (
              <span className="inline-block w-24 h-4 bg-slate-200 rounded animate-pulse" />
            ) : (
              `${activeTemplates.length} template aktif · ${archivedTemplates.length} diarsipkan`
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTemplates}
            className="p-2.5 rounded-xl border border-border bg-white text-text-secondary hover:text-text-primary hover:bg-surface-secondary cursor-pointer transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/admin/templates/new"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:shadow-accent/20 active:scale-[0.98] text-sm"
          >
            <Plus className="w-4 h-4" />
            Buat Template
          </Link>
        </div>
      </div>

      {/* Toggle archived */}
      {!loading && !error && (
        <div className="flex items-center gap-3 animate-fade-in delay-1 opacity-0">
          <button
            onClick={() => setShowArchived(false)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
              !showArchived
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-text-secondary border border-border hover:border-slate-300"
            }`}
          >
            Aktif ({activeTemplates.length})
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
              showArchived
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-text-secondary border border-border hover:border-slate-300"
            }`}
          >
            Semua ({templates.length})
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-danger-bg border border-red-200 text-danger text-sm rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 font-medium">{error}</div>
          <button
            onClick={fetchTemplates}
            className="px-3 py-1.5 bg-white border border-red-200 hover:bg-danger-bg rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Skeleton Loading State */}
      {loading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-border p-6 space-y-4 shadow-xs"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse" />
                <div className="h-3 bg-slate-100 rounded w-5/6 animate-pulse" />
              </div>
              <div className="h-6 bg-slate-50 rounded w-1/3 pt-4 border-t border-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && displayedTemplates.length === 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-xs p-12 text-center max-w-md mx-auto animate-scale-in">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-text-tertiary">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-text-primary">
            Tidak Ada Template Ditemukan
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Belum ada template inspeksi yang terdaftar. Mulai buat template baru untuk standarisasi laporan!
          </p>
        </div>
      )}
      {/* Templates Grid */}
      {!loading && !error && displayedTemplates.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4 animate-fade-in delay-2 opacity-0">
          {displayedTemplates.map((template) => {
            const totalItems = (template.categories || []).reduce(
              (acc, c) => acc + (c.items || []).length,
              0
            );

            return (
              <Link
                key={template.id}
                href={`/admin/templates/${template.id}`}
                className={`block bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group ${
                  template.is_archived
                    ? "border-border opacity-70"
                    : "border-border hover:border-slate-200"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl flex items-center justify-center group-hover:from-purple-500/15 transition-all">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {template.is_default && (
                        <span className="text-xs font-medium bg-purple-50 text-purple-600 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Bawaan
                        </span>
                      )}
                      {template.is_archived && (
                        <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Archive className="w-3 h-3" />
                          Arsip
                        </span>
                      )}
                      {!template.is_default && (
                        <button
                          onClick={(e) => handleDeleteClick(e, template)}
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger-bg opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center justify-center border border-transparent hover:border-red-100"
                          title="Hapus Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-text-primary mt-4">
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border-light">
                    <span className="text-xs text-text-tertiary flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      {(template.categories || []).length} kategori
                    </span>
                    <span className="text-xs text-text-tertiary flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5" />
                      {totalItems} item
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTemplate && (
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
                Apakah Anda yakin ingin menghapus template <strong>{selectedTemplate.name}</strong>? Tindakan ini bersifat permanen dan seluruh kategori serta item pemeriksaan di dalamnya akan ikut terhapus dari sistem.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTemplate(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-text-secondary hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
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
