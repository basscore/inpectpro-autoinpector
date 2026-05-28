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

// PUT: Simpan review laporan akhir super admin dan tandai order "Selesai"
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
    const { overall_score, summary, recommendation } = await request.json();

    if (!overall_score || !summary || !recommendation) {
      return NextResponse.json({ error: "Skor akhir, ringkasan temuan, dan rekomendasi wajib diisi" }, { status: 400 });
    }

    // 1. Simpan/Upsert hasil review ke tabel inspection_results
    const { error: reviewError } = await supabaseAdmin
      .from("inspection_results")
      .upsert({
        order_id: id,
        overall_score: Number(overall_score),
        summary,
        recommendation,
        submitted_at: new Date().toISOString(), // Fallback jika sebelumnya kosong
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "order_id",
      });

    if (reviewError) {
      console.error("Upsert inspection review error:", reviewError);
      return NextResponse.json({ error: "Gagal menyimpan hasil review" }, { status: 500 });
    }

    // 2. Perbarui status order menjadi 'completed' di tabel orders
    const { error: orderError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (orderError) {
      console.error("Update order status to completed error:", orderError);
      return NextResponse.json({ error: "Gagal mengubah status order menjadi Selesai" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Laporan berhasil di-review dan diselesaikan",
    });
  } catch (error: any) {
    console.error("Create Order Review API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
