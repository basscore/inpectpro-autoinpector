"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Car,
  Clock,
  MapPin,
  Users,
  ChevronDown,
  SlidersHorizontal,
  AlertCircle,
  RefreshCw,
  XCircle,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";
import { ORDER_STATUS_CONFIG } from "@/lib/mock-data";

interface Client {
  name: string;
  phone: string;
  email?: string;
}

interface Vehicle {
  brand: string;
  model: string;
  type: string;
  year: number;
  plate_number: string;
  color: string;
  odometer_km: number;
}

interface Order {
  id: string;
  order_number: string;
  client: Client;
  vehicle: Vehicle;
  location: string;
  schedule_date: string;
  schedule_time: string;
  inspector_name: string;
  status: string;
}

const statusFilters = [
  { value: "all", label: "Semua" },
  { value: "assigned", label: "Ditugaskan" },
  { value: "in_progress", label: "Sedang Dikerjakan" },
  { value: "pending_review", label: "Menunggu Review" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // State untuk modal konfirmasi
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"cancel" | "delete">("cancel");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // State untuk bulk delete
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkConfirmText, setBulkConfirmText] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat data order");
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message || "Gagal menghubungkan ke server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openConfirmModal = (order: Order, mode: "cancel" | "delete", e: React.MouseEvent) => {
    e.preventDefault(); // Cegah navigasi ke detail order
    e.stopPropagation();
    setSelectedOrder(order);
    setConfirmMode(mode);
    setActionError("");
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      setActionError("");

      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: confirmMode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses permintaan");

      setShowConfirmModal(false);
      setSelectedOrder(null);
      fetchOrders(); // Refresh daftar
    } catch (err: any) {
      setActionError(err.message || "Terjadi kesalahan");
    } finally {
      setActionLoading(false);
    }
  };

  const executeBulkDelete = async () => {
    try {
      setBulkLoading(true);
      setBulkError("");
      const res = await fetch("/api/admin/orders/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusFilter }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus");
      setShowBulkModal(false);
      setBulkConfirmText("");
      fetchOrders();
    } catch (err: any) {
      setBulkError(err.message || "Terjadi kesalahan");
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      search === "" ||
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.client.name.toLowerCase().includes(search.toLowerCase()) ||
      order.vehicle.brand.toLowerCase().includes(search.toLowerCase()) ||
      order.vehicle.model.toLowerCase().includes(search.toLowerCase()) ||
      order.vehicle.plate_number.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === "all" || order.status === statusFilter;

    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Daftar Order</h1>
          <p className="text-sm text-text-secondary mt-1">
            {loading ? (
              <span className="inline-block w-24 h-4 bg-slate-200 rounded animate-pulse" />
            ) : (
              `${orders.length} order total`
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl border border-border bg-white text-text-secondary hover:text-text-primary hover:bg-surface-secondary cursor-pointer transition-colors"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {orders.length > 0 && (
            <button
              onClick={() => {
                setBulkError("");
                setBulkConfirmText("");
                setShowBulkModal(true);
              }}
              className="inline-flex items-center gap-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-sm"
              title="Hapus semua order (sesuai filter)"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Semua
            </button>
          )}
          <Link
            href="/admin/orders/new"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:shadow-accent/20 active:scale-[0.98] text-sm"
          >
            <Plus className="w-4 h-4" />
            Buat Order Baru
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fade-in delay-1 opacity-0">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari order, klien, kendaraan..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-border rounded-xl px-4 py-2.5 pr-10 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all cursor-pointer"
          >
            {statusFilters.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-danger-bg border border-red-200 text-danger text-sm rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 font-medium">{error}</div>
          <button
            onClick={fetchOrders}
            className="px-3 py-1.5 bg-white border border-red-200 hover:bg-danger-bg rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Status chips (mobile-friendly) */}
      {!loading && !error && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 animate-fade-in delay-2 opacity-0">
          {statusFilters.map((f) => {
            const count =
              f.value === "all"
                ? orders.length
                : orders.filter((o) => o.status === f.value).length;
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                  statusFilter === f.value
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white text-text-secondary border border-border hover:border-slate-300"
                }`}
              >
                {f.label}
                <span className="ml-1.5 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Skeleton Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-border p-5 space-y-3 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && (
        <div className="space-y-3 animate-fade-in delay-3 opacity-0">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border shadow-xs p-12 text-center">
              <div className="w-16 h-16 bg-surface-tertiary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <SlidersHorizontal className="w-7 h-7 text-text-tertiary" />
              </div>
              <p className="text-text-secondary font-medium">
                Tidak ada order yang ditemukan
              </p>
              <p className="text-sm text-text-tertiary mt-1">
                Coba ubah filter atau kata kunci pencarian
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
                label: order.status,
                color: "text-slate-700",
                bg: "bg-slate-50",
              };
              const canCancel = order.status !== "completed" && order.status !== "cancelled";
              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="block bg-white rounded-2xl border border-border shadow-xs hover:shadow-md hover:border-slate-200 transition-all duration-200 cursor-pointer group"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-surface-tertiary rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/5 transition-colors">
                          <Car className="w-6 h-6 text-text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-text-primary">
                              {order.vehicle.brand} {order.vehicle.model}{" "}
                              {order.vehicle.type}
                            </h3>
                            <span className="text-xs text-text-tertiary font-mono">
                              {order.order_number}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-1">
                            {order.vehicle.year} · {order.vehicle.plate_number} · {order.vehicle.color} · {order.vehicle.odometer_km.toLocaleString("id-ID")} km
                          </p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                            <span className="text-xs text-text-secondary flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-text-tertiary" />
                              {order.client.name}
                            </span>
                            <span className="text-xs text-text-secondary flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-text-tertiary" />
                              {order.location.split(",")[0]}
                            </span>
                            <span className="text-xs text-text-secondary flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                              {order.schedule_date.split("-").reverse().join("/")} · {order.schedule_time}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span
                          className={`text-xs font-medium px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}
                        >
                          {statusConfig.label}
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {order.inspector_name}
                        </span>
                        {/* Tombol aksi cancel/delete */}
                        <div className="flex items-center gap-1 mt-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {canCancel && (
                            <button
                              onClick={(e) => openConfirmModal(order, "cancel", e)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-text-tertiary hover:text-amber-600 transition-colors cursor-pointer"
                              title="Batalkan order"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => openConfirmModal(order, "delete", e)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-text-tertiary hover:text-red-600 transition-colors cursor-pointer"
                            title="Hapus order permanen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Modal Konfirmasi */}
      {showConfirmModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  confirmMode === "delete" ? "bg-red-100" : "bg-amber-100"
                }`}>
                  {confirmMode === "delete" ? (
                    <Trash2 className="w-5 h-5 text-red-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-text-primary">
                  {confirmMode === "delete" ? "Hapus Order?" : "Batalkan Order?"}
                </h3>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-2 rounded-lg hover:bg-surface-secondary text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div className={`p-4 rounded-xl border ${
                confirmMode === "delete" 
                  ? "bg-red-50 border-red-200" 
                  : "bg-amber-50 border-amber-200"
              }`}>
                <p className="text-sm font-medium text-text-primary">
                  {selectedOrder.order_number} — {selectedOrder.vehicle.brand} {selectedOrder.vehicle.model}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Klien: {selectedOrder.client.name} · {selectedOrder.vehicle.plate_number}
                </p>
              </div>

              {confirmMode === "delete" ? (
                <div className="space-y-2">
                  <p className="text-sm text-text-secondary">
                    Tindakan ini akan <strong className="text-red-600">menghapus order secara permanen</strong> beserta seluruh data checklist dan hasil inspeksi yang terkait.
                  </p>
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ Tindakan ini tidak bisa dibatalkan!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-text-secondary">
                    Status order akan diubah menjadi <strong className="text-amber-700">&quot;Dibatalkan&quot;</strong>. Data order tetap tersimpan dan bisa dilihat kembali.
                  </p>
                </div>
              )}

              {actionError && (
                <div className="bg-danger-bg border border-red-200 text-danger text-sm rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {actionError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-border-light bg-surface-secondary/50 rounded-b-2xl">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-white border border-border hover:bg-surface-secondary text-text-primary font-semibold rounded-xl text-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={executeAction}
                disabled={actionLoading}
                className={`flex-1 px-4 py-2.5 font-semibold rounded-xl text-sm cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                  confirmMode === "delete"
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-sm"
                    : "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                }`}
              >
                {actionLoading ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Memproses...
                  </>
                ) : confirmMode === "delete" ? (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Ya, Hapus
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Ya, Batalkan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Semua */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">
                  Hapus {statusFilter === "all" ? "Semua" : "Sesuai Filter"}?
                </h3>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                disabled={bulkLoading}
                className="p-2 rounded-lg hover:bg-surface-secondary text-text-tertiary hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-bold text-red-700">
                  {filteredOrders.length} order akan dihapus permanen
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Filter aktif:{" "}
                  <span className="font-mono">
                    {statusFilters.find((f) => f.value === statusFilter)?.label || statusFilter}
                  </span>
                </p>
              </div>

              <div className="space-y-2 text-sm text-text-secondary">
                <p>
                  Tindakan ini akan <strong className="text-red-600">menghapus secara permanen</strong> seluruh order beserta data checklist & hasil inspeksi yang terkait — tidak peduli statusnya (termasuk yang sudah selesai).
                </p>
                <p className="text-red-600 font-medium">⚠️ Tidak bisa dibatalkan!</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Ketik <span className="font-mono font-bold text-red-600">HAPUS</span> untuk konfirmasi
                </label>
                <input
                  type="text"
                  value={bulkConfirmText}
                  onChange={(e) => setBulkConfirmText(e.target.value)}
                  placeholder="HAPUS"
                  disabled={bulkLoading}
                  className="w-full px-3 py-2.5 bg-white border border-border rounded-xl text-sm font-mono focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none transition-all"
                />
              </div>

              {bulkError && (
                <div className="bg-danger-bg border border-red-200 text-danger text-sm rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {bulkError}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-border-light bg-surface-secondary/50 rounded-b-2xl">
              <button
                onClick={() => setShowBulkModal(false)}
                disabled={bulkLoading}
                className="flex-1 px-4 py-2.5 bg-white border border-border hover:bg-surface-secondary text-text-primary font-semibold rounded-xl text-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={executeBulkDelete}
                disabled={bulkLoading || bulkConfirmText !== "HAPUS" || filteredOrders.length === 0}
                className="flex-1 px-4 py-2.5 font-semibold rounded-xl text-sm cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white shadow-sm"
              >
                {bulkLoading ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Hapus {filteredOrders.length} Order
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
