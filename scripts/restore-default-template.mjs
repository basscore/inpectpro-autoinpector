// Kembalikan "Template Inspeksi Standar Mobil" (template bawaan) ke database.
// Aman dijalankan berkali-kali: kalau template bawaan sudah ada, tidak melakukan apa-apa.
// Jalankan via: node scripts/restore-default-template.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("URL atau service role key tidak ditemukan di .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const CATEGORIES = [
  { name: "Mesin", items: ["Fisik Mesin Bagian Atas", "Fisik Mesin Bagian Bawah", "Getaran Mesin", "Kondisi Belt", "Kondisi Knalpot (Asap)", "Kondisi Oli", "Kondisi Saat Starter", "Ruang Mesin", "Suara Mesin RPM 3000", "Suara Mesin Saat Idle"] },
  { name: "Elektrikal Instrumen Cluster", items: ["ABS (Anti lock Brake sistem)", "Diagnos Engine", "EPB (Elektrik Parking Brake)", "EPS (Elektrik Power Steering)", "Fitur Lainnya", "Kondisi Baterai", "Malfungsi Air Bag", "Malfungsi Sistem Pengisian", "Saat Starter", "Sensor Mundur", "Sistem Pendingin", "Sistem Pengisian", "Tekanan Oli"] },
  { name: "Penggerak", items: ["Fisik Transmisi", "Gardan", "Kopling", "Perpindahan 4x4", "Perpindahan Transmisi Manual", "Perpindahan Transmisi Otomatis", "Propoller Shaft"] },
  { name: "Pendingin", items: ["Air Radiator", "Kipas Pendingin", "Kompresor AC", "Kondisi Fisik Radiator", "Kondisi Kondensor", "Kondisi Reservoir", "Kondisi Selang Radiator", "Suhu AC Std Max 10 Derajat", "Tutup Radiator"] },
  { name: "Exterior", items: ["Bumper Depan", "Kap Mesin", "Pintu Depan Kanan", "Pintu Belakang Kanan", "Pintu Bagasi", "Pintu Belakang Kiri", "Pintu Depan Kiri", "Sealer Kap Mesin", "Sealer Pintu Depan Kanan", "Sealer Pintu Belakang Kanan", "Sealer Bagasi", "Sealer Pintu Belakang Kiri", "Sealer Pintu Depan Kiri", "Bumper Belakang", "Fender Depan Kanan", "Fender Depan Kiri", "Fender Belakang Kanan", "Fender Belakang Kiri", "Linner Fender Depan Kanan", "Linner Fender Depan Kiri", "Linner Fender Belakang Kanan", "Linner Fender Belakang Kiri", "Karet Pintu Kanan", "Karet Pintu Kiri", "Kaca Depan", "Kaca Pintu Kanan", "Kaca Spion Kanan", "Kaca Pintu Belakang Kanan", "Kaca Belakang Kanan", "Kaca Belakang", "Kaca Belakang Kiri", "Kaca Pintu Belakang Kiri", "Kaca Spion Kiri", "Kaca Pintu Depan Kiri", "Rumah Lampu Depan Kanan", "Lampu Kepala Kanan", "Lampu Kecil Kanan", "Lampu Sein Kanan", "Lampu Kabut Kanan", "Lampu Spion Kanan", "Lampu Rem Kanan", "Lampu Mundur Kanan", "Lampu Sein Belakang Kanan", "Rumah Lampu Kanan Belakang", "Rumah Lampu Depan Kiri", "Lampu Kepala Kiri", "Lampu Kecil Kiri", "Lampu Sein Kiri", "Lampu Kabut Kiri", "Lampu Spion Kiri", "Lampu Rem Kiri", "Lampu Mundur Kiri", "Lampu Sein Belakang Kiri", "Rumah Lampu Belakang Kiri", "Lisplang Kanan", "Lisplang Kiri", "Wipper Depan", "Wipper Belakang"] },
  { name: "Kaki-Kaki", items: ["Ball Joint Kanan", "Ball Joint Kiri", "Drive Shaft Kanan / As Roda", "Drive Shaft Kiri / As Roda", "Engine Mounting", "Karet Steering Rack Kanan", "Karet Steering Rack Kiri", "Link Stabilizer Kanan", "Link Stabilizer Kiri", "Lower Arm Kanan", "Lower Arm Kiri", "Mounting Transmisi", "Rack End / Long Tie Rod Kanan", "Rack End Kiri", "Shock Belakang Kanan", "Shock Belakang Kiri", "Shock Depan Kanan", "Shock Depan Kiri", "Steering Rack", "Tie Rod Kanan", "Tie Rod Kiri"] },
  { name: "Frame", items: ["Apron Kanan", "Apron Kiri", "Atap", "Bagian Kolong", "Chassis", "Crossmember", "Pilar A Kanan", "Pilar A Kiri", "Pilar B Kanan", "Pilar B Kiri", "Pilar Belakang", "Pilar C Kanan", "Pilar C Kiri", "Rangka Depan"] },
  { name: "Interior", items: ["Dashboard", "Kondisi Odometer", "Kondisi Steer", "Fungsi Tombol Steer", "Klakson", "Tuas Transmisi", "Kondisi Head Unit", "Doortrim Depan Kanan", "Doortrim Bagasi", "Doortrim Belakang Kanan", "Doortrim Belakang Kiri", "Doortrim Depan Kiri", "Kursi Depan Kanan", "Kursi Depan Kiri", "Kursi Tengah", "Kursi Belakang", "Safety Belt Depan Kanan", "Safety Belt Depan Kiri", "Safety Belt Belakang Kanan", "Safety Belt Belakang Kiri", "Konsul Box", "Laci", "Power Window Depan Kanan", "Power Window Depan Kiri", "Power Window Belakang Kanan", "Power Window Belakang Kiri", "Elektrik Mirror", "Retract Spion", "Sunroof", "Plafon", "Lampu Plafon", "Speaker", "Tuas Rem Tangan", "Central Lock / Lock Pintu", "Remote / Kunci", "Kisi AC", "Karpet", "Pedal Rem", "Pedal Gas"] },
  { name: "Ban", items: ["Ban Cadangan", "Kondisi Ban Belakang", "Kondisi Ban Depan", "Velg Belakang", "Velg Depan"] },
  { name: "Sistem Pengereman", items: ["Brake Pad", "Discbrake", "Drum / Tromol", "Minyak Rem"] },
  { name: "Fitur", items: ["ADAS", "Cruise Control", "Idle Start Stop", "Kunci Cadangan", "Kunci Kontak", "Lainnya"] },
  { name: "Steering", items: ["EPS (Elektrik Power Steering)", "Minyak Power Steering", "Power Steering", "Selang Power Steering", "Steering Coloumn"] },
  { name: "No Rangka & Mesin", items: ["Dokumen Dengan Fisik"] },
  { name: "Kelengkapan Dokumen", items: ["BPKB", "Buku Manual", "Buku Service", "Faktur", "Form A", "NIK", "STNK"] },
];

async function main() {
  // 1. Cek apakah template bawaan sudah ada
  const { data: existing, error: checkErr } = await supabase
    .from("templates")
    .select("id")
    .eq("is_default", true)
    .limit(1);
  if (checkErr) {
    console.error("Gagal cek template:", checkErr.message);
    process.exit(1);
  }
  if (existing && existing.length > 0) {
    console.log(`Template bawaan sudah ada (id: ${existing[0].id}). Tidak ada perubahan.`);
    return;
  }

  // 2. Buat template utama
  const { data: template, error: tErr } = await supabase
    .from("templates")
    .insert({
      name: "Template Inspeksi Standar Mobil",
      description:
        "Template bawaan berisi seluruh titik pemeriksaan standar inspeksi mobil. Template ini tidak dapat dihapus, namun isi kategori & itemnya tetap bisa diedit.",
      is_archived: false,
      is_default: true,
    })
    .select("id")
    .single();
  if (tErr || !template) {
    console.error("Gagal membuat template:", tErr?.message);
    process.exit(1);
  }
  console.log(`Template dibuat (id: ${template.id}).`);

  // 3. Buat kategori + item
  let totalItems = 0;
  for (const [idx, cat] of CATEGORIES.entries()) {
    const { data: category, error: cErr } = await supabase
      .from("template_categories")
      .insert({ template_id: template.id, name: cat.name, sort_order: idx + 1 })
      .select("id")
      .single();
    if (cErr || !category) {
      console.error(`Gagal membuat kategori "${cat.name}":`, cErr?.message);
      continue;
    }
    const itemsToInsert = cat.items.map((name, i) => ({
      category_id: category.id,
      name,
      sort_order: i + 1,
    }));
    const { error: iErr } = await supabase.from("template_items").insert(itemsToInsert);
    if (iErr) {
      console.error(`Gagal membuat item kategori "${cat.name}":`, iErr.message);
      continue;
    }
    totalItems += itemsToInsert.length;
    console.log(`  ✓ ${cat.name} (${itemsToInsert.length} item)`);
  }

  console.log(`\nSelesai. ${CATEGORIES.length} kategori, ${totalItems} item.`);
}

main();
