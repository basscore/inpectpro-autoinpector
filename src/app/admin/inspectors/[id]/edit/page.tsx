"use client";

import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  User,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect } from "react";

interface InspectorData {
  id: string;
  username: string;
  name: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

export default function EditInspectorPage() {
  const router = useRouter();
  const params = useParams();
  const inspectorId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [inspector, setInspector] = useState<InspectorData | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Password reset state
  const [resetPassword, setResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchInspector = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/inspectors/${inspectorId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal memuat data inspektor");

        const ins = data.inspector;
        setInspector(ins);
        setName(ins.name || "");
        setPhone(ins.phone || "");
        setEmail(ins.email || "");
      } catch (err: any) {
        setError(err.message || "Gagal terhubung ke server");
      } finally {
        setLoading(false);
      }
    };

    if (inspectorId) {
      fetchInspector();
    }
  }, [inspectorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!name.trim()) {
      setError("Nama lengkap wajib diisi");
      return;
    }

    if (resetPassword && newPassword.length < 8) {
      setError("Password baru minimal harus 8 karakter");
      return;
    }

    setIsSubmitting(true);

    try {
      const body: Record<string, any> = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      };

      if (resetPassword && newPassword) {
        body.password = newPassword;
      }

      const res = await fetch(`/api/admin/inspectors/${inspectorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan perubahan");
      }

      setSuccessMsg("Profil inspektor berhasil diperbarui!");
      setResetPassword(false);
      setNewPassword("");

      // Update local state
      if (data.user) {
        setInspector(data.user);
      }

      // Redirect after short delay
      setTimeout(() => {
        router.push("/admin/inspectors");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Gagal terhubung ke server");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 animate-fade-in">
          <div className="w-9 h-9 bg-slate-100 rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 bg-slate-200 rounded w-48 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-32 animate-pulse" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border shadow-xs p-6 space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-slate-100 rounded w-24 animate-pulse" />
              <div className="h-11 bg-slate-50 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!inspector) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-border shadow-xs p-12 text-center animate-fade-in">
          <div className="w-12 h-12 bg-red-50 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-text-primary">
            Inspektor Tidak Ditemukan
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {error || "Data inspektor tidak dapat dimuat."}
          </p>
          <button
            onClick={() => router.push("/admin/inspectors")}
            className="mt-4 px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold cursor-pointer hover:bg-accent-dark transition-colors"
          >
            Kembali ke Daftar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
            Edit Inspektor
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Ubah profil <span className="font-medium text-text-primary">@{inspector.username}</span>
          </p>
        </div>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="bg-success-bg border border-success/30 text-success text-sm rounded-2xl px-4 py-3 flex items-center gap-2 animate-slide-in-down">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Error Message (top-level) */}
      {error && !successMsg && (
        <div className="bg-danger-bg border border-red-200 text-danger text-sm rounded-2xl px-4 py-3 flex items-center gap-2 animate-slide-in-down">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-border shadow-xs animate-fade-in delay-1 opacity-0 overflow-hidden"
      >
        <div className="p-6 space-y-5">
          {/* Section: Info Profil */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Informasi Profil
              </h2>
              <p className="text-xs text-text-secondary">
                Username tidak dapat diubah
              </p>
            </div>
          </div>

          {/* Username (readonly) */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Username
            </label>
            <input
              type="text"
              value={inspector.username}
              disabled
              className="w-full px-4 py-3 bg-slate-100 border border-border rounded-xl text-text-tertiary text-sm cursor-not-allowed font-mono"
            />
            <p className="text-xs text-text-tertiary mt-1">
              Username bersifat permanen dan tidak bisa diubah.
            </p>
          </div>

          {/* Nama */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Nama Lengkap <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm"
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                No. HP
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081298765432"
                className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email{" "}
                <span className="text-text-tertiary text-xs">(opsional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border-light" />

        {/* Section: Reset Password */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-text-primary">
                Reset Password
              </h2>
              <p className="text-xs text-text-secondary">
                Opsional — inspektor wajib ganti password saat login berikutnya
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={resetPassword}
                onChange={(e) => {
                  setResetPassword(e.target.checked);
                  if (!e.target.checked) setNewPassword("");
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-accent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>

          {resetPassword && (
            <div className="animate-slide-in-down">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Password Baru <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required={resetPassword}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full px-4 py-3 pr-12 bg-surface-secondary border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-warning mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Inspektor akan diminta mengganti password saat login berikutnya.
              </p>
            </div>
          )}
        </div>

        {/* Form Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-light bg-slate-50">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary border border-border rounded-xl hover:bg-surface-secondary transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-white"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
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
                Menyimpan...
              </span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
