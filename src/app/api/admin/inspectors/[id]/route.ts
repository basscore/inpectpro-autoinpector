import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-me";

// Helper untuk memverifikasi admin session
async function verifyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.role === "super_admin") {
      return decoded;
    }
  } catch (e) {
    return null;
  }
  return null;
}

// DELETE: Menghapus inspektor
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const { id } = await params;

    // Hapus inspektor dari tabel users
    // Jika masih dirujuk oleh tabel orders (on delete restrict), Supabase/PostgreSQL akan mengembalikan error 23503.
    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", id)
      .eq("role", "inspector");

    if (error) {
      if (error.code === "23503") {
        return NextResponse.json(
          {
            error:
              "Inspektor tidak dapat dihapus karena sudah memiliki riwayat tugas pemeriksaan. Silakan ubah status menjadi 'Nonaktif' agar inspektor tidak dapat menerima tugas baru.",
          },
          { status: 400 }
        );
      }
      console.error("Delete inspector error:", error);
      return NextResponse.json(
        { error: "Gagal menghapus inspektor: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Akun inspektor berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Delete Inspector API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Mengubah status aktif inspektor
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const { id } = await params;
    const { is_active } = await request.json();

    if (is_active === undefined) {
      return NextResponse.json({ error: "Properti is_active wajib dikirim" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update({ is_active })
      .eq("id", id)
      .eq("role", "inspector");

    if (error) {
      console.error("Update inspector status error:", error);
      return NextResponse.json(
        { error: "Gagal mengubah status aktif inspektor: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Status aktif inspektor berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("Patch Inspector API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
