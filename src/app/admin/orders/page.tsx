"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
