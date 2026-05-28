"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Save,
  LogOut,
  Phone,
  Mail,
  BarChart3,
  Clock,
  Award,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getOfflineOrders } from "@/lib/offline-db";

export default function InspectorProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Password States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          }
        }

        // Fetch completed count
        if (navigator.onLine) {
          const ordersRes = await fetch("/api/inspector/orders");
          if (ordersRes.ok) {
            const data = await ordersRes.json();
            if (data.success && data.orders) {
              const completed = data.orders.filter((o: any) => o.status === "completed").length;
              setCompletedCount(completed);
            }
          }
        } else {
          const offlineOrders = await getOfflineOrders();
          const completed = offlineOrders.filter((o: any) => o.status === "completed").length;
          setCompletedCount(completed);
        }
      } catch (err) {
        console.error("Gagal memuat profil:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Gagal logout:", err);
    }
    router.push("/login");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (!oldPassword || !newPassword) {
      setPwError("Semua field password wajib diisi");
      return;
    }

    if (newPassword.length < 8) {
      setPwError("Password baru minimal harus 8 karakter");
      return;
    }

    setChanging(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPwSuccess("Password berhasil diubah!");
        setOldPassword("");
        setNewPassword("");
      } else {
        setPwError(data.error || "Gagal mengubah password");
      }
    } catch (err) {
      console.error("Change password error:", err);
      setPwError("Gagal menghubungi server");
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <p className="text-sm text-text-secondary">Memuat profil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-secondary flex flex-col items-center justify-center p-4 text-center">
        <p className="text-sm text-text-secondary mb-4">Profil tidak ditemukan</p>
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-semibold"
        >
          Ke Halaman Login
        </button>
      </div>
    );
  }

  const initialLetter = user.name ? user.name.charAt(0).toUpperCase() : "I";

  return (
    <div className="px-4 py-6 max-w-lg mx-auto space-y-5 min-h-screen pb-24">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-border shadow-xs p-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
            {initialLetter}
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{user.name}</h1>
            <p className="text-sm text-text-secondary">@{user.username}</p>
            {user.phone && (
              <p className="text-xs text-text-tertiary mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {user.phone}
              </p>
            )}
            {user.email && (
              <p className="text-xs text-text-tertiary mt-0.5 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {user.email}
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-border-light">
          <div className="text-center">
            <BarChart3 className="w-4 h-4 text-text-tertiary mx-auto mb-1" />
            <p className="text-lg font-bold text-text-primary">{completedCount}</p>
            <p className="text-[10px] text-text-tertiary">Selesai</p>
          </div>
          <div className="text-center">
            <Clock className="w-4 h-4 text-text-tertiary mx-auto mb-1" />
            <p className="text-lg font-bold text-text-primary">
              45<span className="text-xs font-normal"> min</span>
            </p>
            <p className="text-[10px] text-text-tertiary">Rata-rata</p>
          </div>
          <div className="text-center">
            <Award className="w-4 h-4 text-text-tertiary mx-auto mb-1" />
            <p className="text-lg font-bold text-text-primary">
              100<span className="text-xs font-normal">%</span>
            </p>
            <p className="text-[10px] text-text-tertiary">Akurasi</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-border shadow-xs animate-fade-in delay-1">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border-light">
          <Lock className="w-4 h-4 text-text-secondary" />
          <h2 className="text-sm font-semibold text-text-primary">
            Ganti Password
          </h2>
        </div>
        <form onSubmit={handleChangePassword} className="p-5 space-y-4">
          {pwError && (
            <div className="bg-danger-bg border border-danger/30 text-danger text-xs px-3 py-2 rounded-xl">
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="bg-success-bg border border-success/30 text-success text-xs px-3 py-2 rounded-xl">
              {pwSuccess}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Password Lama
            </label>
            <div className="relative">
              <input
                type={showOldPw ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan password lama"
                className="w-full px-3 py-2.5 pr-10 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowOldPw(!showOldPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary cursor-pointer p-1"
              >
                {showOldPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showNewPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full px-3 py-2.5 pr-10 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary cursor-pointer p-1"
              >
                {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={changing}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-xl transition-all cursor-pointer text-sm disabled:opacity-50"
          >
            {changing ? "Memproses..." : "Ganti Password"}
          </button>
        </form>
      </div>

      {/* Template Management (Fitur baru untuk inspektor!) */}
      <div className="bg-white rounded-2xl border border-border shadow-xs animate-fade-in delay-2 p-5">
        <div className="flex items-center gap-3 pb-3 border-b border-border-light">
          <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary">
              Template Inspeksi
            </h2>
            <p className="text-[10px] text-text-tertiary">
              Kelola acuan & item checklist dinamis
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <p className="text-xs text-text-secondary leading-relaxed">
            Buat, duplikasi, arsipkan, atau edit kategori dan poin pemeriksaan checklist inspeksi mobil di lapangan.
          </p>
          <Link
            href="/admin/templates"
            className="w-full inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold py-2.5 rounded-xl transition-all cursor-pointer text-sm shadow-sm hover:shadow-md"
          >
            Kelola Template
          </Link>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-white rounded-2xl border border-border shadow-xs p-4 text-danger font-medium text-sm hover:bg-danger-bg transition-colors cursor-pointer animate-fade-in delay-2 text-center"
      >
        <LogOut className="w-4 h-4" />
        Keluar dari Akun
      </button>
    </div>
  );
}

