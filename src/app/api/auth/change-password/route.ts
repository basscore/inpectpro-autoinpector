import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-me";

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Password saat ini dan password baru wajib diisi" },
        { status: 400 }
      );
    }

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

    // Ambil data user dari database
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", decoded.id)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 401 }
      );
    }

    // Cocokkan password saat ini
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Password saat ini tidak sesuai" },
        { status: 400 }
      );
    }

    // Hash password baru
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // Update database
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        password_hash: newPasswordHash,
        must_change_password: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Update password DB error:", updateError);
      return NextResponse.json(
        { error: "Gagal menyimpan password baru" },
        { status: 500 }
      );
    }

    // Buat JWT token baru dengan must_change_password: false
    const newToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        must_change_password: false,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Update Cookie
    cookieStore.set("session_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Password berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("Change Password API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
