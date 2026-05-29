"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Car,
  MapPin,
  Clock,
  ArrowRight,
  ClipboardCheck,
  CalendarDays,
  WifiOff,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { ORDER_STATUS_CONFIG } from "@/lib/mock-data";
import {
  getOfflineOrders,
  saveOfflineOrders,
  syncOfflineData,
  getQueuedUpdates,
} from "@/lib/offline-db";
import { ListSkeleton } from "@/lib/ui";
import type { Order } from "@/lib/types";

export default function InspectorDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inspectorName, setInspectorName] = useState("Inspektor");
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Monitor network status
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      const handleOnline = () => {
        setIsOffline(false);
        triggerSync();
      };
      const handleOffline = () => setIsOffline(true);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Inspector Name
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.success && meData.user) {
          setInspectorName(meData.user.name);
        }
      }

      // 2. Fetch Inspector Orders
      if (navigator.onLine) {
        const ordersRes = await fetch("/api/inspector/orders");
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (ordersData.success && ordersData.orders) {
            setOrders(ordersData.orders);
            // Save to IndexedDB cache
            await saveOfflineOrders(ordersData.orders);
          }
        }
      } else {
        // Load from IndexedDB if offline
        const offlineOrders = await getOfflineOrders();
        setOrders(offlineOrders);
      }
    } catch (error) {
      console.error("Gagal memuat data dashboard:", error);
      // Fallback ke offline cache
      const offlineOrders = await getOfflineOrders();
      setOrders(offlineOrders);
    } finally {
      setLoading(false);
      checkPendingUpdates();
    }
  };

  const checkPendingUpdates = async () => {
    try {
      const queue = await getQueuedUpdates();
      setPendingSyncCount(queue.length);
    } catch (err) {
      console.error("Gagal memeriksa antrean sync:", err);
    }
  };

  const triggerSync = async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    try {
      const result = await syncOfflineData();
      if (result.successCount > 0) {
        // Reload data after successful sync
        await fetchData();
      }
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
      checkPendingUpdates();
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter orders
  const todayStr = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter((o) => o.schedule_date === todayStr);
  const inProgressOrders = orders.filter((o) => o.status === "in_progress");
  const myOrders = orders;

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6 min-h-screen pb-24">
      {/* Sync Status Banner */}
      <div className="space-y-2 animate-fade-in">
        {isOffline && (
          <div className="bg-amber-500 text-white rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-sm">
            <span className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 animate-pulse" />
              Mode Offline Aktif. Anda tetap bisa mengisi checklist.
            </span>
          </div>
        )}

        {pendingSyncCount > 0 && (
          <div className="bg-info-bg border border-info/30 text-info rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-sm">
            <span className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Ada {pendingSyncCount} perubahan yang belum tersinkron.
            </span>
            {navigator.onLine && (
              <button
                onClick={triggerSync}
                disabled={syncing}
                className="underline hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
              >
                {syncing ? "Sinkronisasi..." : "Sinkronkan Sekarang"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Greeting */}
      <div className="animate-fade-in flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">Selamat datang,</p>
          <h1 className="text-2xl font-bold text-text-primary mt-0.5">
            {inspectorName}
          </h1>
        </div>
        {!isOffline && (
          <button
            onClick={() => {
              triggerSync();
              fetchData();
            }}
            disabled={loading || syncing}
            className="p-2.5 bg-white border border-border rounded-xl text-text-secondary hover:text-text-primary active:scale-95 transition-all cursor-pointer shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading || syncing ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in delay-1">
        <div className="bg-white rounded-2xl border border-border p-4 text-center shadow-xs">
          <p className="text-2xl font-bold text-accent">
            {loading ? "..." : todayOrders.length}
          </p>
          <p className="text-[10px] text-text-tertiary mt-1 uppercase tracking-wider">
            Hari Ini
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4 text-center shadow-xs">
          <p className="text-2xl font-bold text-warning">
            {loading ? "..." : inProgressOrders.length}
          </p>
          <p className="text-[10px] text-text-tertiary mt-1 uppercase tracking-wider">
            Dikerjakan
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-border p-4 text-center shadow-xs">
          <p className="text-2xl font-bold text-success">
            {loading ? "..." : myOrders.filter((o) => o.status === "completed").length}
          </p>
          <p className="text-[10px] text-text-tertiary mt-1 uppercase tracking-wider">
            Selesai
          </p>
        </div>
      </div>

      {/* Current inspection */}
      {inProgressOrders.length > 0 && (
        <div className="animate-fade-in delay-2 space-y-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Sedang Dikerjakan
          </h2>
          {inProgressOrders.map((inProgressOrder) => (
            <Link
              key={inProgressOrder.id}
              href={`/inspector/orders/${inProgressOrder.id}/inspect/checklist`}
              className="block bg-gradient-to-br from-accent to-accent-dark rounded-2xl p-5 text-white shadow-lg shadow-accent/20 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs text-white/70 font-medium">
                    {inProgressOrder.order_number}
                  </p>
                  <h3 className="text-lg font-bold mt-1">
                    {inProgressOrder.vehicle.brand} {inProgressOrder.vehicle.model}
                  </h3>
                  <p className="text-sm text-white/80 mt-0.5">
                    {inProgressOrder.vehicle.year} · {inProgressOrder.vehicle.plate_number}
                  </p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-white/70">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {inProgressOrder.location.split(",")[0]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {inProgressOrder.schedule_time}
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Today's orders */}
      <div className="animate-fade-in delay-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Order Hari Ini
          </h2>
        </div>

        {loading ? (
          <ListSkeleton rows={2} />
        ) : todayOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-xs">
            <ClipboardCheck className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-secondary font-medium">
              Tidak ada order hari ini
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayOrders
              .filter((o) => o.status !== "in_progress")
              .map((order) => {
                const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
                  label: order.status,
                  bg: "bg-gray-100",
                  color: "text-gray-700",
                };
                return (
                  <Link
                    key={order.id}
                    href={`/inspector/orders/${order.id}`}
                    className="block bg-white rounded-2xl border border-border p-4 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 bg-surface-tertiary rounded-xl flex items-center justify-center flex-shrink-0">
                        <Car className="w-5 h-5 text-text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-text-primary">
                            {order.vehicle.brand} {order.vehicle.model}
                          </h3>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusConfig.bg} ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {order.vehicle.year} · {order.vehicle.plate_number}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-text-tertiary flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {order.location.split(",")[0]}
                          </span>
                          <span className="text-xs text-text-tertiary flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {order.schedule_time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </div>

      {/* Upcoming */}
      <div className="animate-fade-in delay-4">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Akan Datang
        </h2>
        {loading ? (
          <ListSkeleton rows={2} />
        ) : myOrders.filter((o) => o.schedule_date > todayStr && o.status !== "completed").length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-6 text-center shadow-xs text-xs text-text-tertiary">
            Tidak ada order mendatang
          </div>
        ) : (
          <div className="space-y-3">
            {myOrders
              .filter((o) => o.schedule_date > todayStr && o.status !== "completed")
              .map((order) => {
                const statusConfig = ORDER_STATUS_CONFIG[order.status] || {
                  label: order.status,
                  bg: "bg-gray-100",
                  color: "text-gray-700",
                };
                return (
                  <Link
                    key={order.id}
                    href={`/inspector/orders/${order.id}`}
                    className="block bg-white rounded-2xl border border-border p-4 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 bg-surface-tertiary rounded-xl flex items-center justify-center flex-shrink-0">
                        <Car className="w-5 h-5 text-text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text-primary">
                          {order.vehicle.brand} {order.vehicle.model}
                        </h3>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {new Date(order.schedule_date).toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          · {order.schedule_time}
                        </p>
                        <span className="text-xs text-text-tertiary flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {order.location.split(",")[0]}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusConfig.bg} ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

