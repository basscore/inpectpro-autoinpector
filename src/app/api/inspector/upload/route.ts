import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-me";
const BUCKET = "inspection-photos";

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

export async function POST(request: Request) {
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const form = await request.formData();
    const file = form.get("file") as File | null;
    const orderId = (form.get("orderId") as string) || "umum";
    const itemId = (form.get("itemId") as string) || "tanpa-item";

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File harus berupa gambar" }, { status: 400 });
    }

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "Ukuran file maksimal 10 MB" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const safeExt = ext.length > 0 && ext.length <= 5 ? ext : "jpg";
    const path = `${orderId}/${itemId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload foto error:", uploadError);
      return NextResponse.json(
        { error: "Gagal upload foto. Pastikan bucket 'inspection-photos' sudah dibuat di Supabase." },
        { status: 500 }
      );
    }

    const { data: publicData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({
      success: true,
      url: publicData.publicUrl,
      path,
    });
  } catch (e: any) {
    console.error("Upload API Error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
