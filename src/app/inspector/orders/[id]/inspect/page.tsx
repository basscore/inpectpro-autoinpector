"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera, WifiOff, Save } from "lucide-react";
import { getOfflineOrderDetail, saveOfflineOrderDetail, queueOfflineUpdate } from "@/lib/offline-db";

export default function InspectVehicleDataPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Form States
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState("");
  const [year, setYear] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [engineNumber, setEngineNumber] = useState("");
  const [odometerKm, setOdometerKm] = useState("");
  const [color, setColor] = useState("");
  const [transmission, setTransmission] = useState("automatic");
  const [fuelType, setFuelType] = useState("bensin");

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

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      try {
        let orderData = null;
        if (navigator.onLine) {
          const res = await fetch(`/api/admin/orders/${id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.order) {
              orderData = data.order;
              await saveOfflineOrderDetail(id, data.order);
            }
          }
        }
        
        if (!orderData) {
          orderData = await getOfflineOrderDetail(id);
        }

        if (orderData) {
          setOrder(orderData);
          setBrand(orderData.vehicle.brand || "");
          setModel(orderData.vehicle.model || "");
          setType(orderData.vehicle.type || "");
          setYear(orderData.vehicle.year?.toString() || "");
          setPlateNumber(orderData.vehicle.plate_number || "");
          setChassisNumber(orderData.vehicle.chassis_number || "");
          setEngineNumber(orderData.vehicle.engine_number || "");
          setOdometerKm(orderData.vehicle.odometer_km?.toString() || "");
          setColor(orderData.vehicle.color || "");
          setTransmission(orderData.vehicle.transmission || "automatic");
          setFuelType(orderData.vehicle.fuel_type || "bensin");
        }
      } catch (e) {
        console.error("Gagal memuat order:", e);
        const cached = await getOfflineOrderDetail(id);
        if (cached) {
          setOrder(cached);
          setBrand(cached.vehicle.brand || "");
          setModel(cached.vehicle.model || "");
          setType(cached.vehicle.type || "");
          setYear(cached.vehicle.year?.toString() || "");
          setPlateNumber(cached.vehicle.plate_number || "");
          setChassisNumber(cached.vehicle.chassis_number || "");
          setEngineNumber(cached.vehicle.engine_number || "");
          setOdometerKm(cached.vehicle.odometer_km?.toString() || "");
          setColor(cached.vehicle.color || "");
          setTransmission(cached.vehicle.transmission || "automatic");
          setFuelType(cached.vehicle.fuel_type || "bensin");
        }
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [id]);

  const handleSave = async (redirect = true) => {
    if (!order) return;
    
    setSaving(true);
    const vehicleData = {
      brand,
      model,
      type,
      year: parseInt(year) || 0,
      plate_number: plateNumber.toUpperCase(),
      chassis_number: chassisNumber.toUpperCase(),
      engine_number: engineNumber.toUpperCase(),
      odometer_km: parseInt(odometerKm) || 0,
      color,
      transmission,
      fuel_type: fuelType,
    };

    try {
      if (navigator.onLine) {
        const res = await fetch(`/api/admin/orders/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vehicle: vehicleData,
          }),
        });

        if (res.ok) {
          const updatedOrder = { ...order, vehicle: vehicleData };
          await saveOfflineOrderDetail(id, updatedOrder);
          if (redirect) {
            router.push(`/inspector/orders/${id}/inspect/checklist`);
          }
          return;
        }
      }

      // Offline flow
      await queueOfflineUpdate(id, { vehicle: vehicleData });
      const updatedOrder = { ...order, vehicle: vehicleData };
      await saveOfflineOrderDetail(id, updatedOrder);
      if (redirect) {
        router.push(`/inspector/orders/${id}/inspect/checklist`);
      }
    } catch (err) {
      console.error("Gagal menyimpan data kendaraan:", err);
      // Offline fallback
      await queueOfflineUpdate(id, { vehicle: vehicleData });
      const updatedOrder = { ...order, vehicle: vehicleData };
      await saveOfflineOrderDetail(id, updatedOrder);
      if (redirect) {
        router.push(`/inspector/orders/${id}/inspect/checklist`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <p className="text-sm text-text-secondary">Memuat data...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-surface-secondary flex flex-col items-center justify-center p-4 text-center">
        <p className="text-sm text-text-secondary mb-4">Order tidak ditemukan</p>
        <button
          onClick={() => router.push("/inspector/dashboard")}
          className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-semibold"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-primary-dark text-white px-4 h-14 flex items-center gap-3 shadow-md">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Data Kendaraan</p>
            {isOffline && (
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
            )}
          </div>
          <p className="text-[10px] text-white/60">{order.order_number}</p>
        </div>
        <span className="text-xs bg-white/10 px-3 py-1 rounded-full">
          Step 1/3
        </span>
      </div>

      {/* Form */}
      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
        {/* Info */}
        <div className="bg-info-bg rounded-xl p-4 text-sm text-info flex items-start gap-2">
          <div className="w-5 h-5 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold">i</span>
          </div>
          <p>Lakukan pemeriksaan fisik kendaraan untuk memverifikasi dan melengkapi data di bawah ini.</p>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-xs p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Merk
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Tipe
              </label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Tahun
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Plat Nomor
            </label>
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              No. Rangka
            </label>
            <input
              type="text"
              value={chassisNumber}
              onChange={(e) => setChassisNumber(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              No. Mesin
            </label>
            <input
              type="text"
              value={engineNumber}
              onChange={(e) => setEngineNumber(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              KM Odometer
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                value={odometerKm}
                onChange={(e) => setOdometerKm(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 border border-border rounded-xl text-sm text-primary font-medium hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Foto
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Warna
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Transmisi
              </label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all cursor-pointer"
              >
                <option value="automatic">Otomatis</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Bahan Bakar
            </label>
            <select
              value={fuelType}
              onChange={(e) => setFuelType(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all cursor-pointer"
            >
              <option value="bensin">Bensin</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric</option>
            </select>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-5 bg-white border border-border rounded-2xl text-text-secondary hover:text-text-primary active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Simpan
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex-1 bg-accent hover:bg-accent-dark text-white font-bold text-center py-4 rounded-2xl shadow-sm transition-all cursor-pointer active:scale-[0.98] text-sm flex items-center justify-center gap-2"
          >
            {saving ? "Menyimpan..." : (
              <>
                Lanjut ke Checklist
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
