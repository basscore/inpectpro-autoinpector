"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  TrendingUp,
  ArrowRight,
  Plus,
  Car,
  Calendar,
  MapPin,
  FileText,
} from "lucide-react";
import { ORDER_STATUS_CONFIG } from "@/lib/mock-data";

interface InspectorLite {
  id: string;
  name: string;
  username: string;
  is_active: boolean;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [inspectors, setInspectors] = useState<InspectorLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Admin Profile info
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            setAdminName(meData.user.name.split(" ")[0]); // Get first name
          }
        }

        // 2. Fetch all orders
        const ordersRes = await fetch("/api/admin/orders");
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          if (data.success) {
            setOrders(data.orders || []);
          }
        }

        // 3. Fetch inspectors
        const inspectorsRes = await fetch("/api/admin/inspectors");
        if (inspectorsRes.ok) {
          const data = await inspectorsRes.json();
          if (data.success) {
            setInspectors(data.inspectors || []);
          }
        }
      } catch (err) {
        console.error("Gagal memuat data dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeInspectors = inspectors.filter((i) => i.is_active);

  // Compute actual dynamic statistics
  const totalOrders = orders.length;
  
  const todayStr = new Date().toISOString().split("T")[0];
  const ordersToday = orders.filter((o) => o.schedule_date === todayStr).length;
  
  const pendingReview = orders.filter((o) => o.status === "pending_review").length;
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const completedThisMonth = orders.filter((o) => {
    if (o.status !== "completed") return false;
    const scheduleDate = new Date(o.schedule_date);
    return scheduleDate.getMonth() === currentMonth && scheduleDate.getFullYear() === currentYear;
  }).length;

  const recentOrders = orders.slice(0, 5);

  const statCards = [
    {
      label: "Total Order",
      value: loading ? "..." : totalOrders,
      icon: ClipboardList,
      color: "from-primary to-primary-light",
      textColor: "text-white",
      iconBg: "bg-white/20",
    },
    {
      label: "Order Hari Ini",
      value: loading ? "..." : ordersToday,
      icon: Calendar,
      color: "from-info to-blue-500",
      textColor: "text-white",
      iconBg: "bg-white/20",
    },
    {
      label: "Menunggu Review",
      value: loading ? "..." : pendingReview,
      icon: AlertCircle,
      color: "from-warning to-amber-400",
      textColor: "text-white",
      iconBg: "bg-white/20",
    },
    {
      label: "Selesai Bulan Ini",
      value: loading ? "..." : completedThisMonth,
      icon: CheckCircle2,
      color: "from-success to-green-500",
      textColor: "text-white",
      iconBg: "bg-white/20",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">
            Selamat datang kembali, {adminName}. Berikut ringkasan hari ini.
          </p>
        </div>
        <Link
          href="/admin/orders/new"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:shadow-accent/20 active:scale-[0.98] text-sm"
        >
          <Plus className="w-4 h-4" />
          Buat Order Baru
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`animate-fade-in bg-gradient-to-br ${stat.color} rounded-2xl p-5 shadow-md relative overflow-hidden cursor-default`}
            >
              <div className="absolute -right-3 -bottom-3 opacity-10">
                <Icon className="w-20 h-20" />
              </div>
              <div className={`inline-flex p-2 rounded-xl ${stat.iconBg} mb-3`}>
                <Icon className={`w-5 h-5 ${stat.textColor}`} />
              </div>
              <p className={`text-3xl font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
              <p className={`text-sm ${stat.textColor} opacity-80 mt-1`}>
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-xs animate-fade-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
            <h2 className="text-lg font-semibold text-text-primary">
              Order Terbaru
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm text-accent hover:text-accent-dark font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              Lihat Semua
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-text-secondary">
              Memuat data order terbaru...
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Car className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary font-medium">Belum ada order terdaftar</p>
              <p className="text-xs text-text-tertiary mt-1">Silakan buat order baru untuk memulai</p>
            </div>
          ) : (
            <div className="divide-y divide-border-light">
              {recentOrders.map((order) => {
                const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
                  label: order.status,
                  color: "text-slate-700",
                  bg: "bg-slate-50",
                };
                return (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-surface-secondary transition-colors cursor-pointer group"
                  >
                    <div className="w-10 h-10 bg-surface-tertiary rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/5 transition-colors">
                      <Car className="w-5 h-5 text-text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary truncate">
                          {order.vehicle.brand} {order.vehicle.model}
                        </p>
                        <span className="text-xs text-text-tertiary font-mono">
                          {order.order_number}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-text-secondary flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {order.client?.name}
                        </span>
                        <span className="text-xs text-text-tertiary hidden sm:flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.location.split(",")[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                      <span className="text-xs text-text-tertiary flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.schedule_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats / Inspector Performance */}
        <div className="space-y-6">
          {/* Active Inspectors */}
          <div className="bg-white rounded-2xl border border-border shadow-xs animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-light">
              <h2 className="text-lg font-semibold text-text-primary">
                Inspektor Aktif
              </h2>
              <Link
                href="/admin/inspectors"
                className="text-sm text-accent hover:text-accent-dark font-medium cursor-pointer transition-colors"
              >
                Semua
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 rounded w-2/3 animate-pulse" />
                      <div className="h-2.5 bg-slate-100 rounded w-1/3 animate-pulse" />
                    </div>
                  </div>
                ))
              ) : activeInspectors.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <Users className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                  <p className="text-sm text-text-secondary font-medium">
                    Belum ada inspektor aktif
                  </p>
                  <Link
                    href="/admin/inspectors/new"
                    className="text-xs text-accent hover:text-accent-dark font-medium mt-1 inline-block"
                  >
                    Tambah inspektor
                  </Link>
                </div>
              ) : (
                activeInspectors.slice(0, 5).map((inspector) => (
                  <Link
                    key={inspector.id}
                    href={`/admin/inspectors/${inspector.id}/edit`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-secondary transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {inspector.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {inspector.name}
                      </p>
                      <p className="text-xs text-text-tertiary font-mono truncate">
                        @{inspector.username}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-border shadow-xs p-4 animate-fade-in">
            <h3 className="text-sm font-semibold text-text-primary mb-3 px-2">
              Aksi Cepat
            </h3>
            <div className="space-y-2">
              {[
                { label: "Buat Order Baru", href: "/admin/orders/new", icon: Plus, color: "text-accent" },
                { label: "Review Laporan", href: "/admin/orders?status=pending_review", icon: AlertCircle, color: "text-purple-600" },
                { label: "Tambah Inspektor", href: "/admin/inspectors/new", icon: Users, color: "text-info" },
                { label: "Kelola Template", href: "/admin/templates", icon: FileText, color: "text-teal-600" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-secondary text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer group"
                  >
                    <Icon className={`w-4 h-4 ${action.color}`} />
                    {action.label}
                    <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

