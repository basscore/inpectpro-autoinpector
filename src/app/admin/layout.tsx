"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Car,
  Shield,
  Bell,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Order", icon: ClipboardList },
  { href: "/admin/inspectors", label: "Inspektor", icon: Users },
  { href: "/admin/templates", label: "Template", icon: FileText },
  { href: "/admin/settings", label: "Pengaturan", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  // Dynamic Profile & Stats
  const [adminName, setAdminName] = useState("Admin");
  const [fullName, setFullName] = useState("Super Admin");
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // 1. Fetch Admin Profile
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const data = await meRes.json();
          if (data.success && data.user) {
            setFullName(data.user.name);
            setAdminName(data.user.name.split(" ")[0]);
          }
        }

        // 2. Fetch Pending Review Orders Count
        const ordersRes = await fetch("/api/admin/orders");
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          if (data.success && data.orders) {
            // Filter pending_review orders
            const pending = data.orders.filter((o: any) => o.status === "pending_review").length;
            setPendingReviewCount(pending);
          }
        }
      } catch (err) {
        console.error("Gagal memuat data layout admin:", err);
      }
    };
    fetchAdminData();
  }, [pathname]); // Refresh on navigation

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Gagal logout:", err);
    }
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === href;
    return pathname.startsWith(href);
  };

  const initialLetter = adminName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-surface-secondary">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-primary-dark flex flex-col z-50 transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-white/10">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center shadow-md shadow-accent/30 relative">
            <Car className="w-5 h-5 text-white" strokeWidth={2.5} />
            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full flex items-center justify-center border border-primary-dark">
              <Shield className="w-2 h-2 text-white" />
            </div>
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">
              InpectPro
            </span>
            <span className="block text-[10px] text-slate-400 -mt-0.5 uppercase tracking-widest">
              Super Admin
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-slate-400 hover:text-white cursor-pointer p-1"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group ${
                  active
                    ? "bg-accent text-white shadow-md shadow-accent/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    active ? "" : "group-hover:scale-110"
                  }`}
                />
                {item.label}
                {item.href === "/admin/orders" && pendingReviewCount > 0 && (
                  <span className="ml-auto bg-accent/20 text-accent-light text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingReviewCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer text-left border-none"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-border h-16 flex items-center px-4 lg:px-8 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-text-secondary hover:text-text-primary cursor-pointer p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Buka menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title area - filled by page */}
          <div className="flex-1" />

          {/* Right actions */}
          <button className="relative text-text-secondary hover:text-text-primary cursor-pointer p-2 rounded-lg hover:bg-surface-secondary transition-colors">
            <Bell className="w-5 h-5" />
            {pendingReviewCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
            )}
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-light rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {initialLetter}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-text-primary leading-tight">
                  {adminName}
                </p>
                <p className="text-xs text-text-tertiary leading-tight">Admin</p>
              </div>
              <ChevronDown className="w-4 h-4 text-text-tertiary hidden md:block" />
            </button>

            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-border py-2 z-50 animate-scale-in">
                  <div className="px-4 py-2 border-b border-border-light">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {fullName}
                    </p>
                    <p className="text-xs text-text-tertiary">Super Admin</p>
                  </div>
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-secondary transition-colors cursor-pointer"
                    onClick={() => setProfileOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Pengaturan
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger-bg transition-colors cursor-pointer text-left border-none"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

