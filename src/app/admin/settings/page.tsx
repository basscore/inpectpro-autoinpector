"use client";

import { useState, useEffect } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Save,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  avatar?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SettingsPage() {
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password state
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      setLoadingProfile(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (data.success && data.user) {
        setProfile(data.user);
        setName(data.user.name || "");
        setPhone(data.user.phone || "");
        setEmail(data.user.email || "");
      }
    } catch (err) {
      console.error("Gagal mengambil data profil:", err);
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);

    if (!name.trim()) {
      setProfileMessage({ type: "error", text: "Nama wajib diisi" });
      return;
    }

    try {
      setSavingProfile(true);
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setProfileMessage({
          type: "success",
          text: data.message || "Profil berhasil diperbarui",
        });
        // Update local profile state
        if (data.user) {
          setProfile(data.user);
        }
      } else {
        setProfileMessage({
          type: "error",
          text: data.error || "Gagal menyimpan profil",
        });
      }
    } catch (err) {
      setProfileMessage({
        type: "error",
        text: "Terjadi kesalahan jaringan",
      });
    } finally {
      setSavingProfile(false);
      // Auto-clear success message after 3 seconds
      setTimeout(() => setProfileMessage(null), 4000);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword || !newPassword) {
      setPasswordMessage({
        type: "error",
        text: "Password lama dan baru wajib diisi",
      });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Password baru minimal 8 karakter",
      });
      return;
    }

    try {
      setSavingPassword(true);
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setPasswordMessage({
          type: "success",
          text: data.message || "Password berhasil diperbarui",
        });
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPasswordMessage({
          type: "error",
          text: data.error || "Gagal mengubah password",
        });
      }
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: "Terjadi kesalahan jaringan",
      });
    } finally {
      setSavingPassword(false);
      setTimeout(() => setPasswordMessage(null), 4000);
    }
  }

  const roleLabel =
    profile?.role === "super_admin" ? "Super Admin" : "Inspektor";
  const initial = profile?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-text-primary">Pengaturan</h1>
        <p className="text-sm text-text-secondary mt-1">
          Konfigurasi akun dan sistem
        </p>
      </div>

      {/* Profile */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white rounded-2xl border border-border shadow-xs animate-fade-in delay-1 opacity-0"
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border-light">
          <User className="w-5 h-5 text-text-secondary" />
          <h2 className="text-base font-semibold text-text-primary">Profil</h2>
        </div>
        <div className="p-6 space-y-4">
          {loadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-text-tertiary animate-spin" />
              <span className="ml-2 text-sm text-text-tertiary">
                Memuat data profil...
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
                  {initial}
                </div>
                <div>
                  <p className="text-lg font-semibold text-text-primary">
                    {profile?.name || "-"}
                  </p>
                  <p className="text-sm text-text-secondary">{roleLabel}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Nama
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profile?.username || ""}
                    disabled
                    className="w-full px-4 py-3 bg-surface-tertiary border border-border rounded-xl text-sm text-text-tertiary cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    No. HP
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Masukkan nomor HP"
                    className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email"
                    className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Profile message */}
              {profileMessage && (
                <div
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                    profileMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {profileMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  {profileMessage.text}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {savingProfile ? "Menyimpan..." : "Simpan Profil"}
                </button>
              </div>
            </>
          )}
        </div>
      </form>

      {/* Change Password */}
      <form
        onSubmit={handleChangePassword}
        className="bg-white rounded-2xl border border-border shadow-xs animate-fade-in delay-2 opacity-0"
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border-light">
          <Lock className="w-5 h-5 text-text-secondary" />
          <h2 className="text-base font-semibold text-text-primary">
            Ganti Password
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Password Lama
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password lama"
                className="w-full px-4 py-3 pr-12 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer p-1"
              >
                {showOldPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full px-4 py-3 pr-12 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer p-1"
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Password message */}
          {passwordMessage && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                passwordMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {passwordMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              {passwordMessage.text}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {savingPassword ? "Menyimpan..." : "Ganti Password"}
            </button>
          </div>
        </div>
      </form>

      {/* App Info */}
      <div className="bg-white rounded-2xl border border-border shadow-xs p-6 animate-fade-in delay-3 opacity-0">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-text-secondary" />
          <h2 className="text-base font-semibold text-text-primary">
            Tentang Aplikasi
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-tertiary">Versi</p>
            <p className="font-medium text-text-primary">1.0.0 (MVP)</p>
          </div>
          <div>
            <p className="text-text-tertiary">Lingkungan</p>
            <p className="font-medium text-text-primary">Production</p>
          </div>
        </div>
      </div>
    </div>
  );
}
