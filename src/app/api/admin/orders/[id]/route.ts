import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-me";

// Helper untuk memverifikasi session
async function verifySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (e) {
    return null;
  }
}

// GET: Ambil detail lengkap satu order, beserta checklist & hasil review
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const { id } = await params;

    // 1. Ambil data Order utama, klien, dan inspektor
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        client:clients(*),
        inspector:users(id, username, name, phone)
      `)
      .eq("id", id)
      .maybeSingle();

    if (orderError || !order) {
      console.error("Fetch order detail error:", orderError);
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    // 2. Ambil nilai checklist
    const { data: checklistValues, error: checklistError } = await supabaseAdmin
      .from("inspection_checklist_values")
      .select("*")
      .eq("order_id", id)
      .order("sort_order", { ascending: true });

    if (checklistError) {
      console.error("Fetch checklist values error:", checklistError);
    }

    // 3. Ambil hasil review
    const { data: review, error: reviewError } = await supabaseAdmin
      .from("inspection_results")
      .select("*")
      .eq("order_id", id)
      .maybeSingle();

    if (reviewError) {
      console.error("Fetch review error:", reviewError);
    }

    // 4. Kelompokkan checklist values ke dalam kategori hirarkis untuk dicocokkan ke UI
    const categoryMap = new Map<string, { id: string; name: string; order: number; items: any[] }>();

    (checklistValues || []).forEach((val) => {
      if (!categoryMap.has(val.category_id)) {
        categoryMap.set(val.category_id, {
          id: val.category_id,
          name: val.category_name,
          order: val.sort_order, // fallback
          items: [],
        });
      }
      categoryMap.get(val.category_id)?.items.push({
        id: val.item_id,
        name: val.item_name,
        status: val.status,
        severity: val.severity || null,
        notes: val.notes || "",
        photos: val.photos || [],
        photo_required: val.photo_required,
        severity_required: val.severity_required,
      });
    });

    const hierarchicalChecklist = Array.from(categoryMap.values()).sort((a, b) => a.order - b.order);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        client: {
          id: order.client?.id,
          name: order.client?.name,
          phone: order.client?.phone,
          email: order.client?.email,
        },
        vehicle: {
          brand: order.vehicle_brand,
          model: order.vehicle_model,
          type: order.vehicle_type,
          year: order.vehicle_year,
          plate_number: order.vehicle_plate_number,
          chassis_number: order.vehicle_chassis_number,
          engine_number: order.vehicle_engine_number,
          odometer_km: order.vehicle_odometer_km,
          odometer_photo: order.vehicle_odometer_photo,
          color: order.vehicle_color,
          transmission: order.vehicle_transmission,
          fuel_type: order.vehicle_fuel_type,
        },
        location: order.location,
        schedule_date: order.schedule_date,
        schedule_time: order.schedule_time ? order.schedule_time.substring(0, 5) : "",
        template_id: order.template_id,
        inspector_id: order.inspector_id,
        inspector_name: order.inspector?.name || "Belum ditugaskan",
        status: order.status,
        notes: order.notes,
        created_at: order.created_at,
        updated_at: order.updated_at,
        checklist: hierarchicalChecklist,
        review: review || null,
      },
    });
  } catch (error: any) {
    console.error("Get Order Detail API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Perbarui progress/status order (baik dari Admin maupun Inspektor di lapangan)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const { id } = await params;
    const { status, vehicle, checklist, notes } = await request.json();

    // 1. Jika ada pembaruan data Order / Kendaraan Utama / Catatan
    if (status || vehicle || notes !== undefined) {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (vehicle) {
        if (vehicle.brand) updateData.vehicle_brand = vehicle.brand;
        if (vehicle.model) updateData.vehicle_model = vehicle.model;
        if (vehicle.type) updateData.vehicle_type = vehicle.type;
        if (vehicle.year) updateData.vehicle_year = Number(vehicle.year);
        if (vehicle.plate_number) updateData.vehicle_plate_number = vehicle.plate_number.toUpperCase();
        if (vehicle.chassis_number) updateData.vehicle_chassis_number = vehicle.chassis_number;
        if (vehicle.engine_number) updateData.vehicle_engine_number = vehicle.engine_number;
        if (vehicle.odometer_km) updateData.vehicle_odometer_km = Number(vehicle.odometer_km);
        if (vehicle.odometer_photo) updateData.vehicle_odometer_photo = vehicle.odometer_photo;
        if (vehicle.color) updateData.vehicle_color = vehicle.color;
        if (vehicle.transmission) updateData.vehicle_transmission = vehicle.transmission;
        if (vehicle.fuel_type) updateData.vehicle_fuel_type = vehicle.fuel_type;
      }
      updateData.updated_at = new Date().toISOString();

      const { error: orderUpdateError } = await supabaseAdmin
        .from("orders")
        .update(updateData)
        .eq("id", id);

      if (orderUpdateError) {
        console.error("Update order details error:", orderUpdateError);
        return NextResponse.json({ error: "Gagal memperbarui data order" }, { status: 500 });
      }
    }

    // 2. Jika ada pembaruan nilai checklist titik inspeksi (inspektor sedang meng-save progress)
    if (checklist && Array.isArray(checklist) && checklist.length > 0) {
      for (const item of checklist) {
        const { error: upsertError } = await supabaseAdmin
          .from("inspection_checklist_values")
          .update({
            status: item.status,
            severity: item.severity || null,
            notes: item.notes || null,
            photos: item.photos || [],
            updated_at: new Date().toISOString(),
          })
          .eq("order_id", id)
          .eq("item_id", item.id);

        if (upsertError) {
          console.error("Upsert checklist item value error:", upsertError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Order berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("Update Order Detail API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Batalkan / hapus order
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifySession();
    if (!user) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    // Hanya super_admin yang boleh menghapus/membatalkan order
    if (user.role !== "super_admin") {
      return NextResponse.json({ error: "Hanya admin yang bisa membatalkan order" }, { status: 403 });
    }

    const { id } = await params;

    // Cek apakah body minta mode "cancel" (soft delete) atau "delete" (hard delete)
    let mode = "cancel";
    try {
      const body = await request.json();
      if (body.mode === "delete") mode = "delete";
    } catch {
      // Jika tidak ada body, default ke cancel
    }

    // 1. Verifikasi order ada dan cek statusnya
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, status, order_number")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    // Tidak boleh menghapus/membatalkan order yang sudah selesai
    if (order.status === "completed") {
      return NextResponse.json(
        { error: "Order yang sudah selesai tidak bisa dibatalkan atau dihapus" },
        { status: 400 }
      );
    }

    if (mode === "delete") {
      // Hard delete: hapus data checklist, hasil review, lalu order
      await supabaseAdmin
        .from("inspection_checklist_values")
        .delete()
        .eq("order_id", id);

      await supabaseAdmin
        .from("inspection_results")
        .delete()
        .eq("order_id", id);

      const { error: deleteError } = await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", id);

      if (deleteError) {
        console.error("Delete order error:", deleteError);
        return NextResponse.json({ error: "Gagal menghapus order" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Order ${order.order_number} berhasil dihapus`,
      });
    } else {
      // Soft delete: ubah status menjadi "cancelled"
      const { error: updateError } = await supabaseAdmin
        .from("orders")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) {
        console.error("Cancel order error:", updateError);
        return NextResponse.json({ error: "Gagal membatalkan order" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Order ${order.order_number} berhasil dibatalkan`,
      });
    }
  } catch (error: any) {
    console.error("Delete/Cancel Order API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
