import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-me";

// Helper untuk memverifikasi session inspektor
async function verifyInspectorSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.role === "inspector") {
      return decoded;
    }
  } catch (e) {
    return null;
  }
  return null;
}

// GET: Ambil daftar order yang ditugaskan khusus untuk inspektor yang login
export async function GET() {
  try {
    const inspector = await verifyInspectorSession();
    if (!inspector) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        client:clients(*)
      `)
      .eq("inspector_id", inspector.id)
      .order("schedule_date", { ascending: true })
      .order("schedule_time", { ascending: true });

    if (error) {
      console.error("Fetch inspector orders error:", error);
      return NextResponse.json({ error: "Gagal mengambil data order" }, { status: 500 });
    }

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
    console.error("Get Inspector Orders API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
