import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-me";

// PUT: Update profile data (name, phone, email)
export async function PUT(request: Request) {
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

    const { name, phone, email } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nama wajib diisi" },
        { status: 400 }
      );
    }

    // Update user profile di database
    const { data: updatedUser, error } = await supabaseAdmin
      .from("users")
      .update({
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", decoded.id)
      .select("id, username, name, role, phone, email, avatar, is_active, must_change_password, created_at, updated_at")
      .single();

    if (error) {
      console.error("Update profile DB error:", error);
      return NextResponse.json(
        { error: "Gagal menyimpan perubahan profil: " + error.message },
        { status: 500 }
      );
    }

    // Buat JWT token baru dengan nama yang sudah diperbarui
    const newToken = jwt.sign(
      {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        role: updatedUser.role,
        must_change_password: updatedUser.must_change_password,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Update Cookie dengan token baru
    cookieStore.set("session_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Profil berhasil diperbarui",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Update Profile API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
