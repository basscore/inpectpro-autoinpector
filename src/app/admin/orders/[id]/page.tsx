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

        <div className="flex items-center gap-2">
          {order.status === "pending_review" && (
            <Link
              href={`/admin/orders/${order.id}/review`}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md text-sm"
            >
              <Eye className="w-4 h-4" />
              Review
            </Link>
          )}
          {order.status === "completed" && (
            <button
              onClick={() => alert("Fitur Export PDF Laporan sedang disiapkan.")}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm text-sm"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          )}
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
        </div>
      </div>
    </div>
  );
}
