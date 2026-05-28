"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Car, MapPin, Clock, ClipboardCheck, WifiOff } from "lucide-react";
import { ORDER_STATUS_CONFIG } from "@/lib/mock-data";
import { getOfflineOrders, saveOfflineOrders } from "@/lib/offline-db";
import { ListSkeleton } from "@/lib/ui";
import type { Order } from "@/lib/types";

export default function InspectorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      const handleStatus = () => setIsOffline(!navigator.onLine);
      window.addEventListener("online", handleStatus);
      window.addEventListener("offline", handleStatus);
      return () => {
        window.removeEventListener("online", handleStatus);
        window.removeEventListener("offline", handleStatus);
      };
    }
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (navigator.onLine) {
        const res = await fetch("/api/inspector/orders");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.orders) {
            setOrders(data.orders);
            await saveOfflineOrders(data.orders);
            return;
          }
        }
      }
      // Fallback
      const offlineOrders = await getOfflineOrders();
      setOrders(offlineOrders);
    } catch (e) {
      console.error("Gagal mengambil data order:", e);
      const offlineOrders = await getOfflineOrders();
      setOrders(offlineOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-4 min-h-screen pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary animate-fade-in">
          Semua Order
        </h1>
        {isOffline && (
          <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full font-medium">
            <WifiOff className="w-3 h-3" /> Offline
          </span>
        )}
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-xs">
          <ClipboardCheck className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Belum ada order</p>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in delay-1">
          {orders.map((order) => {
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
                        <Clock className="w-3 h-3" />
                        {new Date(order.schedule_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        · {order.schedule_time}
                      </span>
                      <span className="text-xs text-text-tertiary flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.location.split(",")[0]}
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
  );
}

