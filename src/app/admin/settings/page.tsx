"use client";

import { useState } from "react";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Save,
  Shield,
  Bell,
  Palette,
} from "lucide-react";

export default function SettingsPage() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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
      <div className="bg-white rounded-2xl border border-border shadow-xs animate-fade-in delay-1 opacity-0">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border-light">
          <User className="w-5 h-5 text-text-secondary" />
          <h2 className="text-base font-semibold text-text-primary">Profil</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
              A
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">
                Arya Pratama
              </p>
              <p className="text-sm text-text-secondary">Super Admin</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Nama
              </label>
              <input
                type="text"
                defaultValue="Arya Pratama"
                className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Username
              </label>
              <input
                type="text"
                defaultValue="arya"
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
                defaultValue="081234567890"
                className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email
              </label>
              <input
                type="email"
                defaultValue="arya@inpectpro.id"
                className="w-full px-4 py-3 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm text-sm">
              <Save className="w-4 h-4" />
              Simpan Profil
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-border shadow-xs animate-fade-in delay-2 opacity-0">
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
                placeholder="Masukkan password lama"
                className="w-full px-4 py-3 pr-12 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer p-1"
              >
                {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                placeholder="Minimal 8 karakter"
                className="w-full px-4 py-3 pr-12 bg-surface-secondary border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer p-1"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm text-sm">
              <Lock className="w-4 h-4" />
              Ganti Password
            </button>
          </div>
        </div>
      </div>

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
