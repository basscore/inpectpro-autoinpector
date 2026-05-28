"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Car,
  Calendar,
  MapPin,
  FileText,
  Users,
  ChevronRight,
  Check,
  AlertCircle,
} from "lucide-react";

type Step = 1 | 2 | 3 | 4;

const steps = [
  { num: 1, label: "Data Klien" },
  { num: 2, label: "Data Mobil" },
  { num: 3, label: "Template & Jadwal" },
  { num: 4, label: "Assign Inspektor" },
];

interface Template {
  id: string;
  name: string;
  description?: string;
  is_archived: boolean;
  categories: any[];
}

interface Inspector {
  id: string;
  name: string;
  phone?: string;
  is_active: boolean;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Lists fetched from API
  const [templates, setTemplates] = useState<Template[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // Step 1: Client Data
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // Step 2: Vehicle Data
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [year, setYear] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [color, setColor] = useState("");
  const [transmission, setTransmission] = useState("automatic");
  const [fuelType, setFuelType] = useState("bensin");
  const [odometerKm, setOdometerKm] = useState("");

  // Step 3: Template & Schedule
  const [templateId, setTemplateId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [location, setLocation] = useState("");

  // Step 4: Inspector & Notes
  const [inspectorId, setInspectorId] = useState("");
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLists = async () => {
      try {
        setLoadingLists(true);
        // Fetch templates
        const tmplRes = await fetch("/api/admin/templates");
        const tmplData = await tmplRes.json();
        setTemplates((tmplData.templates || []).filter((t: Template) => !t.is_archived));

        // Fetch inspectors
        const insRes = await fetch("/api/admin/inspectors");
        const insData = await insRes.json();
        setInspectors((insData.inspectors || []).filter((i: Inspector) => i.is_active));
      } catch (err) {
        console.error("Gagal memuat daftar template/inspektor:", err);
      } finally {
        setLoadingLists(false);
      }
    };
    fetchLists();
  }, []);

  const nextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      if (!clientName.trim() || !clientPhone.trim()) {
        setError("Nama lengkap dan nomor HP wajib diisi");
        return;
      }
    } else if (currentStep === 2) {
      if (!brand.trim() || !model.trim() || !year.trim() || !plateNumber.trim()) {
        setError("Merk, model, tahun, dan plat nomor wajib diisi");
        return;
      }
    } else if (currentStep === 3) {
      if (!templateId || !scheduleDate || !scheduleTime || !location.trim()) {
        setError("Pilih template, isi tanggal/waktu jadwal, dan isi lokasi lengkap");
        return;
      }
    }
    setError("");
    setCurrentStep((s) => Math.min(s + 1, 4) as Step);
  };

  const prevStep = () => {
    setError("");
    setCurrentStep((s) => Math.max(s - 1, 1) as Step);
  };

  const handleSubmit = async () => {
    if (!inspectorId) {
      setError("Silakan pilih inspektor terlebih dahulu");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: clientName,
          client_phone: clientPhone,
          client_email: clientEmail || undefined,
          vehicle_brand: brand,
          vehicle_model: model,
          vehicle_type: vehicleType || undefined,
          vehicle_year: Number(year),
          vehicle_plate_number: plateNumber.toUpperCase(),
          vehicle_chassis_number: "",
          vehicle_engine_number: "",
          vehicle_odometer_km: Number(odometerKm || 0),
          vehicle_color: color || "Lainnya",
          vehicle_transmission: transmission,
          vehicle_fuel_type: fuelType,
          location,
          schedule_date: scheduleDate,
          schedule_time: scheduleTime,
          template_id: templateId,
          inspector_id: inspectorId,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat order baru");

      router.push("/admin/orders");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal menghubungkan ke server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-border text-text-secondary hover:text-text-primary transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            Buat Order Baru
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Isi data order inspeksi baru
          </p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="bg-white rounded-2xl border border-border shadow-xs p-4 animate-fade-in delay-1 opacity-0">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    currentStep >= step.num
                      ? currentStep === step.num
                        ? "bg-accent text-white shadow-md shadow-accent/30"
                        : "bg-success text-white"
                      : "bg-surface-tertiary text-text-tertiary"
                  }`}
                >
                  {currentStep > step.num ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    step.num
                  )}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    currentStep >= step.num
                      ? "text-text-primary"
                      : "text-text-tertiary"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 rounded-full transition-colors duration-300 ${
                    currentStep > step.num ? "bg-success" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-danger-bg border border-red-200 text-danger text-sm rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-border shadow-xs animate-fade-in delay-2 opacity-0 overflow-hidden">
        {/* Step 1: Client Data */}
        {currentStep === 1 && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Data Klien
                </h2>
                <p className="text-xs text-text-secondary">
                  Informasi pemesan jasa inspeksi
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Nama Lengkap <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Contoh: Ahmad Wijaya"
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  No. HP / WhatsApp <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-10 pr-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email <span className="text-text-tertiary text-xs">(opsional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="email@contoh.com"
                    className="w-full pl-10 pr-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Vehicle Data */}
        {currentStep === 2 && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center">
                <Car className="w-5 h-5 text-info" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Data Kendaraan
                </h2>
                <p className="text-xs text-text-secondary">
                  Informasi mobil yang akan diinspeksi
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Merk / Brand <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Contoh: Toyota"
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Model <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Contoh: Avanza"
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Tipe / Varian
                </label>
                <input
                  type="text"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  placeholder="Contoh: 1.5 G AT"
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Tahun Pembuatan <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2022"
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Plat Nomor <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="Contoh: B 1234 XYZ"
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm uppercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  KM Odometer
                </label>
                <input
                  type="number"
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value)}
                  placeholder="Contoh: 45000"
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Warna
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Contoh: Hitam"
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Transmisi
                </label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm cursor-pointer"
                >
                  <option value="automatic">Otomatis</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Jenis Bahan Bakar
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm cursor-pointer"
                >
                  <option value="bensin">Bensin</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Template & Schedule */}
        {currentStep === 3 && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Template & Jadwal
                </h2>
                <p className="text-xs text-text-secondary">
                  Pilih template inspeksi dan tentukan jadwal
                </p>
              </div>
            </div>

            {loadingLists ? (
              <div className="space-y-3 py-6 text-center text-xs text-text-tertiary">
                <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-accent mb-2" />
                <p>Memuat daftar template aktif...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-6 text-sm text-text-secondary bg-slate-50 border border-dashed rounded-xl">
                Belum ada template aktif terdaftar di sistem. Harap buat template terlebih dahulu!
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Template Inspeksi <span className="text-danger">*</span>
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {templates.map((template) => {
                      const totalItems = (template.categories || []).reduce(
                        (acc, c) => acc + (c.items || []).length,
                        0
                      );
                      return (
                        <label
                          key={template.id}
                          className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer group ${
                            templateId === template.id
                              ? "border-accent bg-accent/[0.02]"
                              : "border-border hover:border-accent/30"
                          }`}
                        >
                          <input
                            type="radio"
                            name="template"
                            value={template.id}
                            checked={templateId === template.id}
                            onChange={(e) => setTemplateId(e.target.value)}
                            className="mt-0.5 w-4 h-4 text-accent cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-text-primary">
                              {template.name}
                            </p>
                            {template.description && (
                              <p className="text-xs text-text-secondary mt-0.5">
                                {template.description}
                              </p>
                            )}
                            <p className="text-[10px] text-text-tertiary mt-1">
                              {(template.categories || []).length} kategori · {totalItems} item inspeksi
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Tanggal <span className="text-danger">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                      <input
                        type="date"
                        required
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Waktu <span className="text-danger">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Lokasi Inspeksi <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-text-tertiary" />
                    <textarea
                      rows={2}
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Masukkan alamat lengkap lokasi mobil..."
                      className="w-full pl-10 pr-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Assign Inspector */}
        {currentStep === 4 && (
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-success" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Assign Inspektor
                </h2>
                <p className="text-xs text-text-secondary">
                  Pilih inspektor yang akan menangani inspeksi ini
                </p>
              </div>
            </div>

            {loadingLists ? (
              <div className="space-y-3 py-6 text-center text-xs text-text-tertiary">
                <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-accent mb-2" />
                <p>Memuat daftar inspektor aktif...</p>
              </div>
            ) : inspectors.length === 0 ? (
              <div className="text-center py-6 text-sm text-text-secondary bg-slate-50 border border-dashed rounded-xl">
                Belum ada akun inspektor aktif. Silakan daftarkan inspektor terlebih dahulu!
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {inspectors.map((inspector) => (
                  <label
                    key={inspector.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                      inspectorId === inspector.id
                        ? "border-accent bg-accent/[0.02]"
                        : "border-border hover:border-accent/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="inspector"
                      value={inspector.id}
                      checked={inspectorId === inspector.id}
                      onChange={(e) => setInspectorId(e.target.value)}
                      className="w-4 h-4 text-accent cursor-pointer"
                    />
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">
                      {inspector.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">
                        {inspector.name}
                      </p>
                      {inspector.phone && (
                        <p className="text-xs text-text-secondary">
                          {inspector.phone}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-medium bg-success-bg text-success px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Catatan Tambahan untuk Inspektor{" "}
                <span className="text-text-tertiary text-xs">(opsional)</span>
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan seperti detail kontak pemilik di lokasi atau instruksi pengerjaan..."
                className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-light bg-slate-50">
          {currentStep > 1 ? (
            <button
              onClick={prevStep}
              className="px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-xl hover:bg-surface-secondary transition-all cursor-pointer bg-white"
            >
              Kembali
            </button>
          ) : (
            <div />
          )}
          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2.5 bg-accent hover:bg-accent-dark text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md hover:shadow-accent/20 active:scale-[0.98] flex items-center gap-2"
            >
              Lanjut
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading || loadingLists}
              className="px-6 py-2.5 bg-success hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Membuat Order...
                </span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Buat Order
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
