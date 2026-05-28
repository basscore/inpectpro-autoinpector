import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-me";

async function verifySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

// POST /api/admin/orders/bulk-delete
// Body: { ids?: string[], status?: "all" | OrderStatus }
// - ids: hapus order berdasarkan daftar ID
// - status="all": hapus SEMUA order tanpa kecuali
// - status=<spesifik>: hapus semua order dengan status tersebut
export async function POST(request: Request) {
  try {
    const user = await verifySession();
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Hanya super admin yang bisa hapus massal" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { ids, status } = body as { ids?: string[]; status?: string };

    let targetIds: string[] = [];

    if (Array.isArray(ids) && ids.length > 0) {
      targetIds = ids;
    } else if (status) {
      let query = supabaseAdmin.from("orders").select("id");
      if (status !== "all") {
        query = query.eq("status", status);
      }
      const { data, error } = await query;
      if (error) {
        console.error("Bulk delete fetch ids error:", error);
        return NextResponse.json({ error: "Gagal mengambil daftar order" }, { status: 500 });
      }
      targetIds = (data || []).map((o: any) => o.id);
    } else {
      return NextResponse.json(
        { error: "Harus menyertakan `ids` atau `status` di body" },
        { status: 400 }
      );
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ success: true, deleted: 0, message: "Tidak ada order untuk dihapus" });
    }

    // Hapus data turunan dulu (FK on delete cascade sudah ada, tapi eksplisit lebih aman)
    await supabaseAdmin
      .from("inspection_checklist_values")
      .delete()
      .in("order_id", targetIds);

    await supabaseAdmin
      .from("inspection_results")
      .delete()
      .in("order_id", targetIds);

    const { error: deleteError, count } = await supabaseAdmin
      .from("orders")
      .delete({ count: "exact" })
      .in("id", targetIds);

    if (deleteError) {
      console.error("Bulk delete orders error:", deleteError);
      return NextResponse.json({ error: "Gagal menghapus order" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deleted: count ?? targetIds.length,
      message: `${count ?? targetIds.length} order berhasil dihapus`,
    });
  } catch (e: any) {
    console.error("Bulk delete API Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
