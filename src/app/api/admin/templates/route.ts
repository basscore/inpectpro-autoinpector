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
    if (decoded && (decoded.role === "super_admin" || decoded.role === "inspector")) {
      return decoded;
    }
  } catch (e) {
    return null;
  }
  return null;
}

// GET: Ambil semua template beserta kategori dan itemnya
export async function GET() {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    // Ambil data template beserta relasi kategorinya dan item di dalam kategorinya
    const { data: templates, error } = await supabaseAdmin
      .from("templates")
      .select(`
        id,
        name,
        description,
        is_archived,
        is_default,
        created_at,
        updated_at,
        categories:template_categories(
          id,
          name,
          order:sort_order,
          items:template_items(
            id,
            name,
            description,
            photo_required,
            order:sort_order
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch templates error:", error);
      return NextResponse.json({ error: "Gagal mengambil data template" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      templates: templates || [],
    });
  } catch (error: any) {
    console.error("Get Templates API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Buat template inspeksi baru
export async function POST(request: Request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const { name, description, categories } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Nama template wajib diisi" }, { status: 400 });
    }

    // 1. Simpan template utama
    const { data: template, error: templateError } = await supabaseAdmin
      .from("templates")
      .insert({
        name,
        description: description || null,
        is_archived: false,
      })
      .select("*")
      .single();

    if (templateError || !template) {
      console.error("Insert template error:", templateError);
      return NextResponse.json({ error: "Gagal membuat template baru" }, { status: 500 });
    }

    // Jika ada kategori yang disertakan, simpan kategori dan itemnya
    if (categories && Array.isArray(categories) && categories.length > 0) {
      for (const [catIdx, cat] of categories.entries()) {
        // Simpan kategori
        const { data: category, error: catError } = await supabaseAdmin
          .from("template_categories")
          .insert({
            template_id: template.id,
            name: cat.name,
            sort_order: cat.order !== undefined ? cat.order : catIdx + 1,
          })
          .select("*")
          .single();

        if (catError || !category) {
          console.error("Insert category error:", catError);
          continue; // Lanjutkan ke kategori berikutnya meskipun ada satu yang bermasalah
        }

        // Simpan item jika ada
        if (cat.items && Array.isArray(cat.items) && cat.items.length > 0) {
          const itemsToInsert = cat.items.map((item: any, itemIdx: number) => ({
            category_id: category.id,
            name: item.name,
            description: item.description || null,
            photo_required: item.photo_required ?? true,
            sort_order: item.order !== undefined ? item.order : itemIdx + 1,
          }));

          const { error: itemsError } = await supabaseAdmin
            .from("template_items")
            .insert(itemsToInsert);

          if (itemsError) {
            console.error("Insert items error:", itemsError);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      template_id: template.id,
    });
  } catch (error: any) {
    console.error("Create Template API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
