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

// POST: Tambah item ad-hoc ke order yang sedang diinspeksi
// Body: { category_id, category_name, item_name }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const { id } = await params;
    const { category_id, category_name, item_name } = await request.json();

    if (!category_id || !category_name || !item_name?.trim()) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("inspection_checklist_values")
      .select("sort_order")
      .eq("order_id", id)
      .eq("category_id", category_id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextSort = (existing && existing[0]?.sort_order ? existing[0].sort_order : 0) + 1;

    const itemId = crypto.randomUUID();

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("inspection_checklist_values")
      .insert({
        order_id: id,
        category_id,
        category_name,
        item_id: itemId,
        item_name: item_name.trim(),
        status: null,
        sort_order: nextSort,
        photo_required: false,
        severity_required: false,
        is_answered: false,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Tambah item ad-hoc error:", insertError);
      return NextResponse.json({ error: "Gagal menambah item" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: {
        id: inserted.item_id,
        name: inserted.item_name,
        status: inserted.status,
        severity: null,
        notes: "",
        photos: [],
        photo_required: inserted.photo_required,
        severity_required: inserted.severity_required,
        is_answered: false,
      },
    });
  } catch (e: any) {
    console.error("Tambah item API Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
