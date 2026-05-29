// Reset data: hapus semua orders, klien, templates, inspektor.
// Pertahankan akun super admin. Dijalankan sekali via: node scripts/reset-data.mjs
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

async function wipe(table, filter) {
  const q = supabase.from(table).delete();
  const final = filter ? filter(q) : q.not("id", "is", null);
  const { error, count } = await final;
  if (error) {
    console.error(`  ✗ ${table}:`, error.message);
    return;
  }
  console.log(`  ✓ ${table} dibersihkan${count != null ? ` (${count} baris)` : ""}`);
}

console.log("Mulai reset data InpectPro...\n");

console.log("1. Hapus inspection_checklist_values");
await wipe("inspection_checklist_values", (q) => q.not("id", "is", null));

console.log("2. Hapus inspection_results");
await wipe("inspection_results", (q) => q.not("order_id", "is", null));

console.log("3. Hapus orders");
await wipe("orders", (q) => q.not("id", "is", null));

console.log("4. Hapus clients");
await wipe("clients", (q) => q.not("id", "is", null));

console.log("5. Hapus template_items");
await wipe("template_items", (q) => q.not("id", "is", null));

console.log("6. Hapus template_categories");
await wipe("template_categories", (q) => q.not("id", "is", null));

console.log("7. Hapus templates");
await wipe("templates", (q) => q.not("id", "is", null));

console.log("8. Hapus akun inspektor (super admin dipertahankan)");
await wipe("users", (q) => q.neq("role", "super_admin"));

console.log("\nSelesai. Sisa akun super admin:");
const { data: remaining } = await supabase
  .from("users")
  .select("username, name, role, is_active")
  .order("created_at");
console.table(remaining);
