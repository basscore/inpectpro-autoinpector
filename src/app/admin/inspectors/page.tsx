"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Phone,
  Mail,
  BarChart3,
  UserCheck,
  UserX,
  Clock,
  Award,
  AlertCircle,
  RefreshCw,
  Trash2,
  Power,
} from "lucide-react";

interface Inspector {
  id: string;
  username: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  avatar?: string;
  is_active: boolean;
  stats: {
    total_inspections: number;
    completed_this_month: number;
    average_duration_minutes: number;
    completion_rate: number;
  };
}

export default function InspectorsPage() {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // States for deletion and toggle status
  const [selectedInspector, setSelectedInspector] = useState<Inspector | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const fetchInspectors = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/inspectors");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat data");
      setInspectors(data.inspectors || []);
    } catch (err: any) {
      setError(err.message || "Gagal menghubungkan ke server");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (inspector: Inspector) => {
    setSelectedInspector(inspector);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInspector) return;
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/inspectors/${selectedInspector.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus inspektor");

      setInspectors(inspectors.filter((ins) => ins.id !== selectedInspector.id));
      setShowDeleteModal(false);
      setSelectedInspector(null);
    } catch (err: any) {
      setError(err.message || "Gagal menghapus inspektor");
      setShowDeleteModal(false);
      setSelectedInspector(null);
      // Scroll to top to see the error banner
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (inspector: Inspector) => {
    setIsToggling(inspector.id);
    setError("");
    const newActiveState = !inspector.is_active;
    try {
      const res = await fetch(`/api/admin/inspectors/${inspector.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newActiveState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui status aktif");

      setInspectors(
        inspectors.map((ins) =>
          ins.id === inspector.id ? { ...ins, is_active: newActiveState } : ins
        )
      );
    } catch (err: any) {
      setError(err.message || "Gagal mengubah status aktif");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsToggling(null);
    }
  };

  useEffect(() => {
    fetchInspectors();
  }, []);

  const filteredInspectors = inspectors.filter(
    (ins) =>
      ins.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ins.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = inspectors.filter((i) => i.is_active).length;
  const inactiveCount = inspectors.filter((i) => !i.is_active).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Manajemen Inspektor
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {loading ? (
              <span className="inline-block w-24 h-4 bg-slate-200 rounded animate-pulse" />
            ) : (
              `${activeCount} aktif · ${inactiveCount} nonaktif`
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchInspectors}
            className="p-2.5 rounded-xl border border-border bg-white text-text-secondary hover:text-text-primary hover:bg-surface-secondary cursor-pointer transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/admin/inspectors/new"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:shadow-accent/20 active:scale-[0.98] text-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Inspektor
          </Link>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md animate-fade-in delay-1 opacity-0">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-text-tertiary" />
        </span>
        <input
          type="text"
          placeholder="Cari berdasarkan nama atau username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm shadow-xs"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-danger-bg border border-red-200 text-danger text-sm rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 font-medium">{error}</div>
          <button
            onClick={fetchInspectors}
            className="px-3 py-1.5 bg-white border border-red-200 hover:bg-danger-bg rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Skeleton Loading State */}
      {loading && (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-border p-6 space-y-4 shadow-xs"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-2/3 animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded w-1/3 animate-pulse" />
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse" />
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                <div className="h-10 bg-slate-50 rounded animate-pulse" />
                <div className="h-10 bg-slate-50 rounded animate-pulse" />
                <div className="h-10 bg-slate-50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredInspectors.length === 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-xs p-12 text-center max-w-md mx-auto animate-scale-in">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-text-tertiary">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-text-primary">
            Tidak Ada Inspektor Ditemukan
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            {searchTerm
              ? "Coba sesuaikan kata kunci pencarian Anda."
              : "Belum ada inspektor yang terdaftar. Mulai tambahkan akun inspektor baru!"}
          </p>
        </div>
      )}

      {/* Inspector Cards */}
      {!loading && !error && filteredInspectors.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4 animate-fade-in delay-2 opacity-0">
          {filteredInspectors.map((inspector) => {
            const stats = inspector.stats;
            return (
              <div
                key={inspector.id}
                className={`bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all duration-200 cursor-default group ${
                  inspector.is_active
                    ? "border-border"
                    : "border-border opacity-70 bg-slate-50/30"
                }`}
              >
                <div className="p-6">
                  {/* Profile */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm">
                        {inspector.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-text-primary">
                          {inspector.name}
                        </h3>
                        <p className="text-xs text-text-tertiary font-mono">
                          @{inspector.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Badge (Standard State) */}
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 transition-all group-hover:hidden ${
                          inspector.is_active
                            ? "bg-success-bg text-success"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {inspector.is_active ? (
                          <UserCheck className="w-3 h-3" />
                        ) : (
                          <UserX className="w-3 h-3" />
                        )}
                        {inspector.is_active ? "Aktif" : "Nonaktif"}
                      </span>

                      {/* Hover Actions */}
                      <div className="hidden group-hover:flex items-center gap-1.5 animate-fade-in">
                        <button
                          onClick={() => handleToggleStatus(inspector)}
                          disabled={isToggling === inspector.id}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                            inspector.is_active
                              ? "bg-slate-50 border-border text-slate-500 hover:text-success hover:border-success/30 hover:bg-success-bg/10"
                              : "bg-slate-50 border-border text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          } disabled:opacity-50`}
                          title={inspector.is_active ? "Nonaktifkan akun" : "Aktifkan akun"}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(inspector)}
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger-bg cursor-pointer flex items-center justify-center border border-transparent hover:border-red-100"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3.5">
                    {inspector.phone && (
                      <span className="text-xs text-text-secondary flex items-center gap-1">
                        <Phone className="w-3 h-3 text-text-tertiary" />
                        {inspector.phone}
                      </span>
                    )}
                    {inspector.email && (
                      <span className="text-xs text-text-secondary flex items-center gap-1">
                        <Mail className="w-3 h-3 text-text-tertiary" />
                        {inspector.email}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  {stats && (
                    <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border-light">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-text-tertiary mb-1">
                          <BarChart3 className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-lg font-bold text-text-primary">
                          {stats.total_inspections}
                        </p>
                        <p className="text-[10px] text-text-tertiary">
                          Total Inspeksi
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-text-tertiary mb-1">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-lg font-bold text-text-primary">
                          {stats.average_duration_minutes}
                          <span className="text-xs font-normal text-text-tertiary">
                            min
                          </span>
                        </p>
                        <p className="text-[10px] text-text-tertiary">Rata-rata</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-text-tertiary mb-1">
                          <Award className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-lg font-bold text-text-primary">
                          {stats.completion_rate}
                          <span className="text-xs font-normal text-text-tertiary">
                            %
                          </span>
                        </p>
                        <p className="text-[10px] text-text-tertiary">Completion</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedInspector && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-border shadow-xl max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="w-12 h-12 bg-red-50 text-danger rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">
                Hapus Akun Inspektor?
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Apakah Anda yakin ingin menghapus akun inspektor <strong>{selectedInspector.name}</strong>? Tindakan ini bersifat permanen dan seluruh data profilnya akan dihapus dari sistem.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedInspector(null);
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
                {isDeleting ? "Menghapus..." : "Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
