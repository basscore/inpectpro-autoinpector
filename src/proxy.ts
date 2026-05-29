import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Helper sederhana untuk men-decode JWT di Edge Runtime (tanpa dependensi Node.js crypto)
function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    
    // Gunakan atob bawaan standar Edge Runtime
    const rawData = atob(base64);
    const jsonPayload = decodeURIComponent(
      rawData
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Baca session_token cookie
  const token = request.cookies.get("session_token")?.value;

  // 1. Kasus: User tidak memiliki token sesi
  if (!token) {
    // Jika mencoba mengakses halaman internal admin atau inspector, lempar ke login
    if (pathname.startsWith("/admin") || pathname.startsWith("/inspector")) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. Kasus: User memiliki token sesi
  const payload = parseJwt(token);

  // Jika token rusak atau expired, hapus token dan redirect ke login
  if (!payload || !payload.exp || payload.exp < Date.now() / 1000) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session_token");
    return response;
  }

  // Jika user sudah login dan mencoba mengakses halaman login, arahkan ke dashboard masing-masing
  if (pathname === "/login" || pathname === "/") {
    if (payload.role === "super_admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else if (payload.role === "inspector") {
      return NextResponse.redirect(new URL("/inspector/dashboard", request.url));
    }
  }

  // Proteksi Rute Super Admin
  if (pathname.startsWith("/admin")) {
    // Izinkan inspektor mengakses kelola template di /admin/templates
    if (payload.role === "inspector" && pathname.startsWith("/admin/templates")) {
      // Izinkan
    } else if (payload.role !== "super_admin") {
      // Jika dia inspektor, lempar ke dashboard inspektor
      if (payload.role === "inspector") {
        return NextResponse.redirect(new URL("/inspector/dashboard", request.url));
      }
      // Jika role tidak dikenal, lempar ke login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("session_token");
      return response;
    }
  }

  // Proteksi Rute Inspektor
  if (pathname.startsWith("/inspector")) {
    if (payload.role !== "inspector" && payload.role !== "super_admin") {
      // Jika role tidak dikenal, lempar ke login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("session_token");
      return response;
    }
  }

  // Proteksi Rute Laporan Cetak / Orders
  if (pathname.startsWith("/orders")) {
    if (payload.role !== "super_admin" && payload.role !== "inspector") {
      // Jika role tidak dikenal, lempar ke login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("session_token");
      return response;
    }
  }

  return NextResponse.next();
}

// Jalankan proxy pada rute admin, inspector, login, orders, dan root
export const config = {
  matcher: ["/admin/:path*", "/inspector/:path*", "/orders/:path*", "/login", "/"],
};
