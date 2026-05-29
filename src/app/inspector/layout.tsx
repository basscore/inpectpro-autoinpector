"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  User,
  Shield,
  Wifi,
  WifiOff,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useState, useEffect } from "react";

const tabs = [
  { href: "/inspector/dashboard", label: "Beranda", icon: LayoutDashboard },
  { href: "/inspector/orders", label: "Order", icon: ClipboardList },
  { href: "/inspector/profile", label: "Profil", icon: User },
];

export default function InspectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.user?.role === "super_admin") {
          setIsSuperAdmin(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Status online harus mengikuti koneksi asli perangkat, bukan toggle manual.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setIsOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
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

  // Check if currently in inspection mode (hide bottom nav)
  // Match /inspect as a path segment, not /inspector — must be followed by / or end-of-string
  const isInspectionMode = /\/inspect(\/|$)/.test(pathname);

  const isActive = (href: string) => {
    if (href === "/inspector/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
      {/* Banner Super Admin — selalu sediakan pintu balik ke dashboard admin */}
      {isSuperAdmin && (
        <div className="bg-primary-dark text-white text-xs font-medium py-2 px-4 flex items-center justify-center gap-3 animate-slide-in-down">
          <Shield className="w-3.5 h-3.5 text-accent-light flex-shrink-0" />
          <span className="opacity-90 hidden sm:inline">
            Anda super admin sedang melihat area inspektor.
          </span>
          <span className="opacity-90 sm:hidden">Mode super admin</span>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors cursor-pointer font-semibold"
          >
            <ArrowLeft className="w-3 h-3" />
            Kembali ke Admin
          </Link>
        </div>
      )}

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-warning text-white text-xs font-medium text-center py-2 px-4 flex items-center justify-center gap-2 animate-slide-in-down">
          <WifiOff className="w-3.5 h-3.5" />
          Mode Offline — Data tersimpan lokal
        </div>
      )}

      {/* Top bar */}
      {!isInspectionMode && (
        <header className="sticky top-0 z-30 bg-primary-dark text-white px-4 h-14 flex items-center gap-3 shadow-md">
          <img
            src="/brand/logogram.svg"
            alt=""
            className="w-8 h-8 flex-shrink-0"
          />
          <img
            src="/brand/logotype.svg"
            alt="InpectPro"
            className="h-4 w-auto"
          />
          <div className="ml-auto flex items-center gap-2">
            <span
              className="p-2 rounded-lg"
              aria-label={isOnline ? "Terhubung ke internet" : "Sedang offline"}
              title={isOnline ? "Terhubung ke internet" : "Sedang offline"}
            >
              {isOnline ? (
                <Wifi className="w-4 h-4 text-success-light" />
              ) : (
                <WifiOff className="w-4 h-4 text-warning-light" />
              )}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/20 text-slate-200 hover:text-red-300 text-xs font-medium transition-colors cursor-pointer border border-white/10 hover:border-red-400/30"
              aria-label="Logout"
              title="Keluar dari Akun"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Keluar</span>
            </button>
          </div>
        </header>
      )}

      {/* Content */}
      <main className={`flex-1 ${isInspectionMode ? "" : "pb-20"}`}>
        {children}
      </main>

      {/* Bottom Tab Navigation */}
      {!isInspectionMode && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-border shadow-lg">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                    active
                      ? "text-accent"
                      : "text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-accent" : ""}`} />
                  <span className={`text-[10px] font-medium ${active ? "text-accent" : ""}`}>
                    {tab.label}
                  </span>
                  {active && (
                    <div className="absolute bottom-1 w-1 h-1 bg-accent rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
          {/* Safe area for iOS */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
      )}
    </div>
  );
}
