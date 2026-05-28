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

// GET: Ambil detail satu template
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

    const { data: template, error } = await supabaseAdmin
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
            severity_required,
            order:sort_order
          )
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error || !template) {
      console.error("Fetch template detail error:", error);
      return NextResponse.json({ error: "Template tidak ditemukan" }, { status: 404 });
    }

    // Urutkan kategori & item berdasarkan kolom order/sort_order
    const sortedCategories = (template.categories || []).map((cat: any) => ({
      ...cat,
      items: (cat.items || []).sort((a: any, b: any) => a.order - b.order),
    })).sort((a: any, b: any) => a.order - b.order);

    return NextResponse.json({
      success: true,
      template: {
        ...template,
        categories: sortedCategories,
      },
    });
  } catch (error: any) {
    console.error("Get Template Detail API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Perbarui template (nama, deskripsi, status arsip, atau struktur kategori/item)
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
    const { name, description, is_archived, categories } = await request.json();

    // 1. Update metadata template
    const { error: updateError } = await supabaseAdmin
      .from("templates")
      .update({
        name,
        description: description ?? null,
        is_archived: is_archived ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Update template metadata error:", updateError);
      return NextResponse.json({ error: "Gagal memperbarui metadata template" }, { status: 500 });
    }

    // Jika ada penyesuaian kategori, atur ulang
    if (categories && Array.isArray(categories)) {
      // Hapus kategori lama (akan men-cascade menghapus item lama di PostgreSQL)
      const { error: deleteCatsError } = await supabaseAdmin
        .from("template_categories")
        .delete()
        .eq("template_id", id);

      if (deleteCatsError) {
        console.error("Delete old categories error:", deleteCatsError);
      }

      // Re-insert semua kategori & item baru
      for (const [catIdx, cat] of categories.entries()) {
        const { data: category, error: catError } = await supabaseAdmin
          .from("template_categories")
          .insert({
            template_id: id,
            name: cat.name,
            sort_order: cat.order !== undefined ? cat.order : catIdx + 1,
          })
          .select("*")
          .single();

        if (catError || !category) {
          console.error("Re-insert category error:", catError);
          continue;
        }

        if (cat.items && Array.isArray(cat.items) && cat.items.length > 0) {
          const itemsToInsert = cat.items.map((item: any, itemIdx: number) => ({
            category_id: category.id,
            name: item.name,
            description: item.description || null,
            photo_required: item.photo_required ?? true,
            severity_required: item.severity_required ?? true,
            sort_order: item.order !== undefined ? item.order : itemIdx + 1,
          }));

          const { error: itemsError } = await supabaseAdmin
            .from("template_items")
            .insert(itemsToInsert);

          if (itemsError) {
            console.error("Re-insert items error:", itemsError);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Template berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("Update Template API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Menghapus template
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

    // Cek apakah template ini adalah template bawaan (tidak boleh dihapus).
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("templates")
      .select("is_default")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("Fetch template before delete error:", fetchError);
      return NextResponse.json(
        { error: "Gagal memeriksa template" },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Template tidak ditemukan" },
        { status: 404 }
      );
    }

    if (existing.is_default) {
      return NextResponse.json(
        {
          error:
            "Template bawaan tidak dapat dihapus. Anda tetap bisa mengedit kategori dan itemnya, atau arsipkan jika tidak ingin muncul pada order baru.",
        },
        { status: 400 }
      );
    }

    // Hapus template dari DB.
    // Jika masih dirujuk oleh tabel orders (on delete restrict), Supabase/PostgreSQL akan mengembalikan error 23503.
    const { error } = await supabaseAdmin
      .from("templates")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "23503") {
        return NextResponse.json(
          {
            error:
              "Template tidak dapat dihapus karena sudah memiliki riwayat transaksi order. Silakan gunakan fitur 'Arsipkan' agar template tidak muncul pada pilihan order baru.",
          },
          { status: 400 }
        );
      }
      console.error("Delete template error:", error);
      return NextResponse.json(
        { error: "Gagal menghapus template: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Template berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Delete Template API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
