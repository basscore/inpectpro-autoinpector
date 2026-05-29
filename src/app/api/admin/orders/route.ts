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

// GET: Ambil semua order beserta join klien dan inspektor
export async function GET() {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        client:clients(*),
        inspector:users(id, username, name, phone)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch orders error:", error);
      return NextResponse.json({ error: "Gagal mengambil data order" }, { status: 500 });
    }

    // Ubah format agar sesuai interface TypeScript
    const formattedOrders = (orders || []).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      client: {
        id: o.client?.id,
        name: o.client?.name,
        phone: o.client?.phone,
        email: o.client?.email,
      },
      vehicle: {
        brand: o.vehicle_brand,
        model: o.vehicle_model,
        type: o.vehicle_type,
        year: o.vehicle_year,
        plate_number: o.vehicle_plate_number,
        chassis_number: o.vehicle_chassis_number,
        engine_number: o.vehicle_engine_number,
        odometer_km: o.vehicle_odometer_km,
        odometer_photo: o.vehicle_odometer_photo,
        color: o.vehicle_color,
        transmission: o.vehicle_transmission,
        fuel_type: o.vehicle_fuel_type,
      },
      location: o.location,
      schedule_date: o.schedule_date,
      schedule_time: o.schedule_time ? o.schedule_time.substring(0, 5) : "",
      template_id: o.template_id,
      inspector_id: o.inspector_id,
      inspector_name: o.inspector?.name || "Belum ditugaskan",
      status: o.status,
      notes: o.notes,
      created_at: o.created_at,
      updated_at: o.updated_at,
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error: any) {
    console.error("Get Orders API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Buat order baru
export async function POST(request: Request) {
  try {
    const admin = await verifyAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const {
      client_name,
      client_phone,
      client_email,
      vehicle_brand,
      vehicle_model,
      vehicle_type,
      vehicle_year,
      vehicle_plate_number,
      vehicle_chassis_number,
      vehicle_engine_number,
      vehicle_odometer_km,
      vehicle_color,
      vehicle_transmission,
      vehicle_fuel_type,
      location,
      schedule_date,
      schedule_time,
      template_id,
      inspector_id,
      notes,
    } = await request.json();

    if (
      !client_name ||
      !client_phone ||
      !vehicle_brand ||
      !vehicle_model ||
      !vehicle_plate_number ||
      !location ||
      !schedule_date ||
      !schedule_time ||
      !template_id ||
      !inspector_id
    ) {
      return NextResponse.json({ error: "Semua kolom wajib diisi" }, { status: 400 });
    }

    // 1. Dapatkan / Buat data klien
    let clientId: string;
    const { data: existingClient } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("phone", client_phone)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient, error: clientError } = await supabaseAdmin
        .from("clients")
        .insert({
          name: client_name,
          phone: client_phone,
          email: client_email || null,
        })
        .select("id")
        .single();

      if (clientError || !newClient) {
        console.error("Insert client error:", clientError);
        return NextResponse.json({ error: "Gagal memproses data klien" }, { status: 500 });
      }
      clientId = newClient.id;
    }

    // 2. Generate Nomor Order Sekuensial (INP-YYYY-XXXX)
    const currentYear = new Date().getFullYear();
    const { count } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true });
    
    const sequentialNumber = String((count || 0) + 1).padStart(3, "0");
    const orderNumber = `INP-${currentYear}-${sequentialNumber}`;

    // 3. Simpan data Order utama
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        client_id: clientId,
        location,
        schedule_date,
        schedule_time,
        template_id,
        inspector_id,
        status: "assigned", // Sesuai PRD, ditugaskan langsung
        notes: notes || null,
        vehicle_brand,
        vehicle_model,
        vehicle_type,
        vehicle_year: Number(vehicle_year),
        vehicle_plate_number,
        vehicle_chassis_number: vehicle_chassis_number || "",
        vehicle_engine_number: vehicle_engine_number || "",
        vehicle_odometer_km: Number(vehicle_odometer_km || 0),
        vehicle_color,
        vehicle_transmission,
        vehicle_fuel_type,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Insert order error:", orderError);
      return NextResponse.json({ error: "Gagal membuat order baru" }, { status: 500 });
    }

    // 4. Salin kategori & item dari template terpilih ke tabel checklist order nyata
    // Ambil semua kategori & item template
    const { data: categories, error: catsError } = await supabaseAdmin
      .from("template_categories")
      .select(`
        id,
        name,
        sort_order,
        items:template_items(
          id,
          name,
          description,
          photo_required,
          sort_order
        )
      `)
      .eq("template_id", template_id);

    if (catsError) {
      console.error("Fetch template categories for order error:", catsError);
    }

    if (categories && categories.length > 0) {
      const checklistValuesToInsert: any[] = [];

      categories.forEach((cat) => {
        const items = cat.items || [];
        items.forEach((item: any) => {
          checklistValuesToInsert.push({
            order_id: order.id,
            category_id: cat.id,
            category_name: cat.name,
            item_id: item.id,
            item_name: item.name,
            status: null, // Belum diisi
            sort_order: item.sort_order,
            photo_required: item.photo_required,
            is_answered: false,
          });
        });
      });

      if (checklistValuesToInsert.length > 0) {
        const { error: checklistError } = await supabaseAdmin
          .from("inspection_checklist_values")
          .insert(checklistValuesToInsert);

        if (checklistError) {
          console.error("Populate checklist values error:", checklistError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: orderNumber,
    });
  } catch (error: any) {
    console.error("Create Order API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
