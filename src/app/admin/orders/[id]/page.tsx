"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Users,
  Eye,
  Download,
  AlertCircle,
  XCircle,
  Trash2,
  X,
  AlertTriangle,
  Play,
  Pencil,
  Shuffle,
  Check,
} from "lucide-react";
import { ORDER_STATUS_CONFIG } from "@/lib/mock-data";

// Semua status yang boleh dipilih super admin dari UI ubah status.
const SELECTABLE_STATUSES: { value: string; label: string; description: string }[] = [
  { value: "draft", label: "Draft", description: "Order belum siap dikerjakan" },
  { value: "assigned", label: "Ditugaskan", description: "Inspektor sudah ditugaskan" },
  { value: "in_progress", label: "Sedang Dikerjakan", description: "Inspeksi sedang berjalan di lapangan" },
  { value: "pending_review", label: "Menunggu Review", description: "Hasil sudah masuk, menunggu admin me-review" },
  { value: "completed", label: "Selesai", description: "Laporan sudah final dan diserahkan ke klien" },
  { value: "cancelled", label: "Dibatalkan", description: "Order dibatalkan, data tetap tersimpan" },
];

interface Client {
  name: string;
  phone: string;
  email?: string;
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
  odometer_photo?: string;
  color: string;
  transmission: string;
  fuel_type: string;
}

interface Order {
  id: string;
  order_number: string;
  client: Client;
  vehicle: Vehicle;
  location: string;
  schedule_date: string;
  schedule_time: string;
  template_name: string;
  inspector_name: string;
  status: string;
  created_at: string;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State untuk modal konfirmasi
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"cancel" | "delete">("cancel");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // State untuk modal ubah status
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState<string>("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/admin/orders/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat detail order");
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message || "Gagal menghubungkan ke server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleCancelOrder = () => {
    setConfirmMode("cancel");
    setActionError("");
    setShowConfirmModal(true);
  };

  const handleDeleteOrder = () => {
    setConfirmMode("delete");
    setActionError("");
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    try {
      setActionLoading(true);
      setActionError("");

      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: confirmMode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses permintaan");

      setShowConfirmModal(false);

      if (confirmMode === "delete") {
        // Hard delete: kembali ke daftar order
        router.push("/admin/orders");
      } else {
        // Cancel: refresh data order
        fetchOrderDetail();
      }
    } catch (err: any) {
      setActionError(err.message || "Terjadi kesalahan");
    } finally {
      setActionLoading(false);
    }
  };

  // Apakah order bisa dibatalkan (soft delete)
  const canCancelOrDelete = order && order.status !== "completed" && order.status !== "cancelled";

  // Apakah ada laporan yang bisa dilihat/edit oleh admin
  const canEditReport =
    order &&
    (order.status === "in_progress" ||
      order.status === "pending_review" ||
      order.status === "completed");

  const openStatusModal = () => {
    if (!order) return;
    setStatusTarget(order.status);
    setStatusError("");
    setShowStatusModal(true);
  };

  const submitStatusChange = async () => {
    if (!order || !statusTarget || statusTarget === order.status) {
      setShowStatusModal(false);
      return;
    }
    try {
      setStatusSaving(true);
      setStatusError("");
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusTarget }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status");
      setShowStatusModal(false);
      fetchOrderDetail();
    } catch (err: any) {
      setStatusError(err.message || "Gagal menghubungkan ke server");
    } finally {
      setStatusSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-12 text-center text-text-secondary">
        <span className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-2" />
        <p>Memuat rincian order...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-border p-6 space-y-4 text-center mt-12">
        <AlertCircle className="w-12 h-12 text-danger mx-auto" />
        <h3 className="text-base font-semibold text-text-primary">Gagal Memuat Rincian</h3>
        <p className="text-sm text-text-secondary">{error || "Order tidak ditemukan."}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
    label: order.status,
    color: "text-slate-700",
    bg: "bg-slate-50",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-border text-text-secondary hover:text-text-primary transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary">
                {order.order_number}
              </h1>
              <span
                className={`text-xs font-medium px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}
              >
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-text-secondary mt-0.5">
              Dibuat {new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={openStatusModal}
            className="inline-flex items-center gap-2 bg-white border border-border hover:bg-surface-secondary text-text-primary font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs text-sm"
            title="Ubah status order"
          >
            <Shuffle className="w-4 h-4" />
            Ubah Status
          </button>
          {(order.status === "assigned" || order.status === "in_progress") && (
            <Link
              href={`/inspector/orders/${order.id}`}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md text-sm"
            >
              <Play className="w-4 h-4" />
              Jalankan Inspeksi
            </Link>
          )}
          {canEditReport && (
            <Link
              href={`/admin/orders/${order.id}/review`}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md text-sm"
              title="Lihat dan edit laporan inspeksi"
            >
              <Pencil className="w-4 h-4" />
              {order.status === "completed" ? "Edit Laporan" : "Review / Edit Laporan"}
            </Link>
          )}
          {order.status === "completed" && (
            <Link
              href={`/orders/${order.id}/print`}
              target="_blank"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm text-sm"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </Link>
          )}
          {canCancelOrDelete && (
            <button
              onClick={handleCancelOrder}
              className="inline-flex items-center gap-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer text-sm"
              title="Batalkan order ini"
            >
              <XCircle className="w-4 h-4" />
              Batalkan
            </button>
          )}
          <button
            onClick={handleDeleteOrder}
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md text-sm"
            title="Hapus order secara permanen"
          >
            <Trash2 className="w-4 h-4" />
            Hapus
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle */}
          <div className="bg-white rounded-2xl border border-border shadow-xs animate-fade-in delay-1 opacity-0">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border-light">
              <Car className="w-5 h-5 text-text-secondary" />
              <h2 className="text-base font-semibold text-text-primary">
                Data Kendaraan
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center">
                  <Car className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">
                    {order.vehicle.brand} {order.vehicle.model} {order.vehicle.type || ""}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {order.vehicle.year} · {order.vehicle.color} ·{" "}
                    {order.vehicle.transmission === "automatic" ? "Otomatis" : "Manual"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Plat Nomor", value: order.vehicle.plate_number },
                  { label: "Odometer", value: `${(order.vehicle.odometer_km || 0).toLocaleString("id-ID")} km` },
                  { label: "No. Rangka", value: order.vehicle.chassis_number || "Tidak diisi" },
                  { label: "No. Mesin", value: order.vehicle.engine_number || "Tidak diisi" },
                  { label: "Bahan Bakar", value: order.vehicle.fuel_type === "bensin" ? "Bensin" : order.vehicle.fuel_type },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-text-tertiary uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-text-primary mt-0.5">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule & Location */}
          <div className="bg-white rounded-2xl border border-border shadow-xs animate-fade-in delay-2 opacity-0">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border-light">
              <Calendar className="w-5 h-5 text-text-secondary" />
              <h2 className="text-base font-semibold text-text-primary">
                Jadwal & Lokasi
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-info/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-info" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Tanggal & Waktu</p>
                  <p className="text-sm font-medium text-text-primary">
                    {new Date(order.schedule_date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    · {order.schedule_time} WIB
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Lokasi</p>
                  <p className="text-sm font-medium text-text-primary">
                    {order.location}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-teal-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Template Inspeksi</p>
                  <p className="text-sm font-medium text-text-primary">
                    {order.template_name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client */}
          <div className="bg-white rounded-2xl border border-border shadow-xs animate-fade-in delay-3 opacity-0">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border-light">
              <User className="w-5 h-5 text-text-secondary" />
              <h2 className="text-base font-semibold text-text-primary">Klien</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-accent">
                    {order.client.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {order.client.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Phone className="w-4 h-4 text-text-tertiary" />
                {order.client.phone}
              </div>
              {order.client.email && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Mail className="w-4 h-4 text-text-tertiary" />
                  {order.client.email}
                </div>
              )}
            </div>
          </div>

          {/* Inspector */}
          <div className="bg-white rounded-2xl border border-border shadow-xs animate-fade-in delay-4 opacity-0">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border-light">
              <Users className="w-5 h-5 text-text-secondary" />
              <h2 className="text-base font-semibold text-text-primary">
                Inspektor
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm">
                  {order.inspector_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    {order.inspector_name}
                  </p>
                  <p className="text-xs text-text-tertiary font-medium">Inspektor Lapangan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Aksi Cepat (Cancel/Delete) — di sidebar juga */}
          <div className="bg-white rounded-2xl border border-border shadow-xs animate-fade-in delay-5 opacity-0">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border-light">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h2 className="text-base font-semibold text-text-primary">
                Zona Bahaya
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {canCancelOrDelete && (
                <button
                  onClick={handleCancelOrder}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  Batalkan Order
                </button>
              )}
              <button
                onClick={handleDeleteOrder}
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Hapus Permanen
              </button>
              <p className="text-xs text-text-tertiary text-center mt-1">
                {canCancelOrDelete
                  ? "Batalkan = ubah status. Hapus = hilangkan data sepenuhnya."
                  : "Hapus permanen akan menghilangkan order beserta seluruh data inspeksinya."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ubah Status */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shuffle className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">Ubah Status Order</h3>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-2 rounded-lg hover:bg-surface-secondary text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-text-tertiary mb-1">
                Pilih status baru untuk <strong>{order.order_number}</strong>. Status sekarang:{" "}
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </p>
              {SELECTABLE_STATUSES.map((s) => {
                const selected = statusTarget === s.value;
                const isCurrent = order.status === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => setStatusTarget(s.value)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? "border-accent bg-accent/5 ring-2 ring-accent/20"
                        : "border-border hover:bg-surface-secondary"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selected ? "border-accent bg-accent" : "border-border bg-white"
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-text-primary">{s.label}</p>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            saat ini
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">{s.description}</p>
                    </div>
                  </button>
                );
              })}

              {statusError && (
                <div className="bg-danger-bg border border-red-200 text-danger text-sm rounded-xl p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {statusError}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-border-light bg-surface-secondary/50 rounded-b-2xl">
              <button
                onClick={() => setShowStatusModal(false)}
                disabled={statusSaving}
                className="flex-1 px-4 py-2.5 bg-white border border-border hover:bg-surface-secondary text-text-primary font-semibold rounded-xl text-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={submitStatusChange}
                disabled={statusSaving || !statusTarget || statusTarget === order.status}
                className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl text-sm cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {statusSaving ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Simpan Status
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi */}
      {showConfirmModal && (
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
                  {order.order_number} — {order.vehicle.brand} {order.vehicle.model}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Klien: {order.client.name} · {order.vehicle.plate_number}
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
    </div>
  );
}
