"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  User,
  Car,
  Shield,
  Wifi,
  WifiOff,
  LogOut,
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
  const isInspectionMode = pathname.includes("/inspect");

  const isActive = (href: string) => {
    if (href === "/inspector/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
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
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center relative">
            <Car className="w-4 h-4 text-white" strokeWidth={2.5} />
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border border-primary-dark flex items-center justify-center">
              <Shield className="w-1.5 h-1.5 text-white" />
            </div>
          </div>
          <span className="font-bold text-base tracking-tight">InpectPro</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Toggle online status"
            >
              {isOnline ? (
                <Wifi className="w-4 h-4 text-success-light" />
              ) : (
                <WifiOff className="w-4 h-4 text-warning-light" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors cursor-pointer"
              aria-label="Logout"
              title="Keluar dari Akun"
            >
              <LogOut className="w-4 h-4" />
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
