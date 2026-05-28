import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
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

// GET: Ambil data satu inspektor berdasarkan ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const { id } = await params;

    const { data: inspector, error } = await supabaseAdmin
      .from("users")
      .select("id, username, name, role, phone, email, avatar, is_active, created_at")
      .eq("id", id)
      .eq("role", "inspector")
      .maybeSingle();

    if (error || !inspector) {
      return NextResponse.json(
        { error: "Inspektor tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, inspector });
  } catch (error: any) {
    console.error("Get Inspector API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Mengubah profil inspektor (nama, phone, email, password)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const { id } = await params;
    const { name, phone, email, password } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Nama lengkap wajib diisi" },
        { status: 400 }
      );
    }

    // Siapkan data yang akan diupdate
    const updateData: Record<string, any> = {
      name,
      phone: phone || null,
      email: email || null,
      updated_at: new Date().toISOString(),
    };

    // Jika admin mengirim password baru, hash dan simpan
    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password baru minimal harus 8 karakter" },
          { status: 400 }
        );
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
      updateData.must_change_password = true; // Wajib ganti password saat login berikutnya
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", id)
      .eq("role", "inspector")
      .select("id, username, name, role, phone, email, is_active, created_at")
      .single();

    if (error || !updatedUser) {
      console.error("Update inspector profile error:", error);
      return NextResponse.json(
        { error: "Gagal memperbarui profil inspektor: " + (error?.message || "Data tidak ditemukan") },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profil inspektor berhasil diperbarui",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Put Inspector API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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
