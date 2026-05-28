import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-me";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Tidak diotorisasi, silakan login kembali" },
        { status: 401 }
      );
    }

    // Verifikasi JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { error: "Sesi tidak valid atau kadaluwarsa" },
        { status: 401 }
      );
    }

    // Ambil data terbaru dari database Supabase
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", decoded.id)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan atau dinonaktifkan" },
        { status: 401 }
      );
    }

    // Singkirkan password_hash dari response
    const { password_hash, ...userResponse } = user;

    return NextResponse.json({
      success: true,
      user: userResponse,
    });
  } catch (error: any) {
    console.error("Get Me API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
