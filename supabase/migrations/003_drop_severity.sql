-- Hapus permanen kolom severity & severity_required.
-- Fitur "tingkat keparahan" sudah dihilangkan dari UI dan kode aplikasi.
-- Jalankan di Supabase Studio > SQL Editor.

alter table public.inspection_checklist_values
  drop column if exists severity,
  drop column if exists severity_required;

alter table public.template_items
  drop column if exists severity_required;
