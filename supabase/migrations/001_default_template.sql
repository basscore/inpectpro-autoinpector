-- ============================================================
-- Migration: Tambah kolom is_default + seed default template
-- ============================================================
-- Cara pakai:
--   Buka Supabase Dashboard → SQL Editor → New query →
--   tempel seluruh isi file ini → klik "Run".
-- Aman dijalankan berkali-kali (idempoten).
-- ============================================================

-- 1. Tambah kolom is_default jika belum ada
alter table public.templates
  add column if not exists is_default boolean default false not null;

-- 2. Buat / pastikan default template ada
do $$
declare
  v_template_id uuid;
  v_category_id uuid;
begin
  -- Cek apakah default template sudah ada
  select id into v_template_id
  from public.templates
  where is_default = true
  limit 1;

  if v_template_id is not null then
    raise notice 'Default template sudah ada (id: %), tidak ada perubahan.', v_template_id;
    return;
  end if;

  -- Insert template utama
  insert into public.templates (name, description, is_archived, is_default)
  values (
    'Template Inspeksi Standar Mobil',
    'Template bawaan berisi seluruh titik pemeriksaan standar inspeksi mobil. Template ini tidak dapat dihapus, namun isi kategori & itemnya tetap bisa diedit.',
    false,
    true
  )
  returning id into v_template_id;

  ----------------------------------------------------------------
  -- KATEGORI 1: Mesin
  ----------------------------------------------------------------
  insert into public.template_categories (template_id, name, sort_order)
  values (v_template_id, 'Mesin', 1)
  returning id into v_category_id;

  insert into public.template_items (category_id, name, sort_order) values
    (v_category_id, 'Fisik Mesin Bagian Atas', 1),
    (v_category_id, 'Fisik Mesin Bagian Bawah', 2),
    (v_category_id, 'Getaran Mesin', 3),
    (v_category_id, 'Kondisi Belt', 4),
    (v_category_id, 'Kondisi Knalpot (Asap)', 5),
    (v_category_id, 'Kondisi Oli', 6),
    (v_category_id, 'Kondisi Saat Starter', 7),
    (v_category_id, 'Ruang Mesin', 8),
    (v_category_id, 'Suara Mesin RPM 3000', 9),
    (v_category_id, 'Suara Mesin Saat Idle', 10);

  ----------------------------------------------------------------
  -- KATEGORI 2: Elektrikal Instrumen Cluster
  ----------------------------------------------------------------
  insert into public.template_categories (template_id, name, sort_order)
  values (v_template_id, 'Elektrikal Instrumen Cluster', 2)
  returning id into v_category_id;

  insert into public.template_items (category_id, name, sort_order) values
    (v_category_id, 'ABS (Anti lock Brake sistem)', 1),
    (v_category_id, 'Diagnos Engine', 2),
    (v_category_id, 'EPB (Elektrik Parking Brake)', 3),
    (v_category_id, 'EPS (Elektrik Power Steering)', 4),
    (v_category_id, 'Fitur Lainnya', 5),
    (v_category_id, 'Kondisi Baterai', 6),
    (v_category_id, 'Malfungsi Air Bag', 7),
    (v_category_id, 'Malfungsi Sistem Pengisian', 8),
    (v_category_id, 'Saat Starter', 9),
    (v_category_id, 'Sensor Mundur', 10),
    (v_category_id, 'Sistem Pendingin', 11),
    (v_category_id, 'Sistem Pengisian', 12),
    (v_category_id, 'Tekanan Oli', 13);

  ----------------------------------------------------------------
  -- KATEGORI 3: Penggerak
  ----------------------------------------------------------------
  insert into public.template_categories (template_id, name, sort_order)
  values (v_template_id, 'Penggerak', 3)
  returning id into v_category_id;

  insert into public.template_items (category_id, name, sort_order) values
    (v_category_id, 'Fisik Transmisi', 1),
    (v_category_id, 'Gardan', 2),
    (v_category_id, 'Kopling', 3),
    (v_category_id, 'Perpindahan 4x4', 4),
    (v_category_id, 'Perpindahan Transmisi Manual', 5),
    (v_category_id, 'Perpindahan Transmisi Otomatis', 6),
    (v_category_id, 'Propoller Shaft', 7);

  ----------------------------------------------------------------
  -- KATEGORI 4: Pendingin
  ----------------------------------------------------------------
  insert into public.template_categories (template_id, name, sort_order)
  values (v_template_id, 'Pendingin', 4)
  returning id into v_category_id;

  insert into public.template_items (category_id, name, sort_order) values
    (v_category_id, 'Air Radiator', 1),
    (v_category_id, 'Kipas Pendingin', 2),
    (v_category_id, 'Kompresor AC', 3),
    (v_category_id, 'Kondisi Fisik Radiator', 4),
    (v_category_id, 'Kondisi Kondensor', 5),
    (v_category_id, 'Kondisi Reservoir', 6),
    (v_category_id, 'Kondisi Selang Radiator', 7),
    (v_category_id, 'Suhu AC Std Max 10 Derajat', 8),
    (v_category_id, 'Tutup Radiator', 9);

  ----------------------------------------------------------------
  -- KATEGORI 5: Exterior
  ----------------------------------------------------------------
  insert into public.template_categories (template_id, name, sort_order)
  values (v_template_id, 'Exterior', 5)
  returning id into v_category_id;

  insert into public.template_items (category_id, name, sort_order) values
    (v_category_id, 'Bumper Depan', 1),
    (v_category_id, 'Kap Mesin', 2),
    (v_category_id, 'Pintu Depan Kanan', 3),
    (v_category_id, 'Pintu Belakang Kanan', 4),
    (v_category_id, 'Pintu Bagasi', 5),
    (v_category_id, 'Pintu Belakang Kiri', 6),
    (v_category_id, 'Pintu Depan Kiri', 7),
    (v_category_id, 'Sealer Kap Mesin', 8),
    (v_category_id, 'Sealer Pintu Depan Kanan', 9),
    (v_category_id, 'Sealer Pintu Belakang Kanan', 10),
    (v_category_id, 'Sealer Bagasi', 11),
    (v_category_id, 'Sealer Pintu Belakang Kiri', 12),
    (v_category_id, 'Sealer Pintu Depan Kiri', 13),
    (v_category_id, 'Bumper Belakang', 14),
    (v_category_id, 'Fender Depan Kanan', 15),
    (v_category_id, 'Fender Depan Kiri', 16),
    (v_category_id, 'Fender Belakang Kanan', 17),
    (v_category_id, 'Fender Belakang Kiri', 18),
    (v_category_id, 'Linner Fender Depan Kanan', 19),
    (v_category_id, 'Linner Fender Depan Kiri', 20),
    (v_category_id, 'Linner Fender Belakang Kanan', 21),
    (v_category_id, 'Linner Fender Belakang Kiri', 22),
    (v_category_id, 'Karet Pintu Kanan', 23),
    (v_category_id, 'Karet Pintu Kiri', 24),
    (v_category_id, 'Kaca Depan', 25),
    (v_category_id, 'Kaca Pintu Kanan', 26),
    (v_category_id, 'Kaca Spion Kanan', 27),
    (v_category_id, 'Kaca Pintu Belakang Kanan', 28),
    (v_category_id, 'Kaca Belakang Kanan', 29),
    (v_category_id, 'Kaca Belakang', 30),
    (v_category_id, 'Kaca Belakang Kiri', 31),
    (v_category_id, 'Kaca Pintu Belakang Kiri', 32),
    (v_category_id, 'Kaca Spion Kiri', 33),
    (v_category_id, 'Kaca Pintu Depan Kiri', 34),
    (v_category_id, 'Rumah Lampu Depan Kanan', 35),
    (v_category_id, 'Lampu Kepala Kanan', 36),
    (v_category_id, 'Lampu Kecil Kanan', 37),
    (v_category_id, 'Lampu Sein Kanan', 38),
    (v_category_id, 'Lampu Kabut Kanan', 39),
    (v_category_id, 'Lampu Spion Kanan', 40),
    (v_category_id, 'Lampu Rem Kanan', 41),
    (v_category_id, 'Lampu Mundur Kanan', 42),
    (v_category_id, 'Lampu Sein Belakang Kanan', 43),
    (v_category_id, 'Rumah Lampu Kanan Belakang', 44),
    (v_category_id, 'Rumah Lampu Depan Kiri', 45),
    (v_category_id, 'Lampu Kepala Kiri', 46),
    (v_category_id, 'Lampu Kecil Kiri', 47),
    (v_category_id, 'Lampu Sein Kiri', 48),
    (v_category_id, 'Lampu Kabut Kiri', 49),
    (v_category_id, 'Lampu Spion Kiri', 50),
    (v_category_id, 'Lampu Rem Kiri', 51),
    (v_category_id, 'Lampu Mundur Kiri', 52),
    (v_category_id, 'Lampu Sein Belakang Kiri', 53),
    (v_category_id, 'Rumah Lampu Belakang Kiri', 54),
    (v_category_id, 'Lisplang Kanan', 55),
    (v_category_id, 'Lisplang Kiri', 56),
    (v_category_id, 'Wipper Depan', 57),
    (v_category_id, 'Wipper Belakang', 58);

  ----------------------------------------------------------------
  -- KATEGORI 6: Kaki-Kaki
  ----------------------------------------------------------------
  insert into public.template_categories (template_id, name, sort_order)
  values (v_template_id, 'Kaki-Kaki', 6)
  returning id into v_category_id;

  insert into public.template_items (category_id, name, sort_order) values
    (v_category_id, 'Ball Joint Kanan', 1),
    (v_category_id, 'Ball Joint Kiri', 2),
    (v_category_id, 'Drive Shaft Kanan / As Roda', 3),
    (v_category_id, 'Drive Shaft Kiri / As Roda', 4),
    (v_category_id, 'Engine Mounting', 5),
    (v_category_id, 'Karet Steering Rack Kanan', 6),
    (v_category_id, 'Karet Steering Rack Kiri', 7),
    (v_category_id, 'Link Stabilizer Kanan', 8),
    (v_category_id, 'Link Stabilizer Kiri', 9),
    (v_category_id, 'Lower Arm Kanan', 10),
    (v_category_id, 'Lower Arm Kiri', 11),
    (v_category_id, 'Mounting Transmisi', 12),
    (v_category_id, 'Rack End / Long Tie Rod Kanan', 13),
    (v_category_id, 'Rack End Kiri', 14),
    (v_category_id, 'Shock Belakang Kanan', 15),
    (v_category_id, 'Shock Belakang Kiri', 16),
    (v_category_id, 'Shock Depan Kanan', 17),
    (v_category_id, 'Shock Depan Kiri', 18),
    (v_category_id, 'Steering Rack', 19),
    (v_category_id, 'Tie Rod Kanan', 20),
    (v_category_id, 'Tie Rod Kiri', 21);

  ----------------------------------------------------------------
  -- KATEGORI 7: Frame
  ----------------------------------------------------------------
  insert into public.template_categories (template_id, name, sort_order)
  values (v_template_id, 'Frame', 7)
  returning id into v_category_id;

  insert into public.template_items (category_id, name, sort_order) values
    (v_category_id, 'Apron Kanan', 1),
    (v_category_id, 'Apron Kiri', 2),
    (v_category_id, 'Atap', 3),
    (v_category_id, 'Bagian Kolong', 4),
    (v_category_id, 'Chassis', 5),
    (v_category_id, 'Crossmember', 6),
    (v_category_id, 'Pilar A Kanan', 7),
    (v_category_id, 'Pilar A Kiri', 8),
    (v_category_id, 'Pilar B Kanan', 9),
    (v_category_id, 'Pilar B Kiri', 10),
    (v_category_id, 'Pilar Belakang', 11),
    (v_category_id, 'Pilar C Kanan', 12),
    (v_category_id, 'Pilar C Kiri', 13),
    (v_category_id, 'Rangka Depan', 14);

  ----------------------------------------------------------------
  -- KATEGORI 8: Interior
  ----------------------------------------------------------------
  insert into public.template_categories (template_id, name, sort_order)
  values (v_template_id, 'Interior', 8)
  returning id into v_category_id;

  insert into public.template_items (category_id, name, sort_order) values
    (v_category_id, 'Dashboard', 1),
    (v_category_id, 'Kondisi Odometer', 2),
    (v_category_id, 'Kondisi Steer', 3),
    (v_category_id, 'Fungsi Tombol Steer', 4),
    (v_category_id, 'Klakson', 5),
    (v_category_id, 'Tuas Transmisi', 6),
    (v_category_id, 'Kondisi Head Unit', 7),
    (v_category_id, 'Doortrim Depan Kanan', 8),
    (v_category_id, 'Doortrim Bagasi', 9),
    (v_category_id, 'Doortrim Belakang Kanan', 10),
    (v_category_id, 'Doortrim Belakang Kiri', 11),
    (v_category_id, 'Doortrim Depan Kiri', 12),
    (v_category_id, 'Kursi Depan Kanan', 13),
    (v_category_id, 'Kursi Depan Kiri', 14),
    (v_category_id, 'Kursi Tengah', 15),
    (v_category_id, 'Kursi Belakang', 16),
    (v_category_id, 'Safety Belt Depan Kanan', 17),
    (v_category_id, 'Safety Belt Depan Kiri', 18),
    (v_category_id, 'Safety Belt Belakang Kanan', 19),
    (v_category_id, 'Safety Belt Belakang Kiri', 20),
    (v_category_id, 'Konsul Box', 21),
    (v_category_id, 'Laci', 22),
    (v_category_id, 'Power Window Depan Kanan', 23),
    (v_category_id, 'Power Window Depan Kiri', 24),
    (v_category_id, 'Power Window Belakang Kanan', 25),
    (v_category_id, 'Power Window Belakang Kiri', 26),
    (v_category_id, 'Elektrik Mirror', 27),
    (v_category_id, 'Retract Spion', 28),
    (v_category_id, 'Sunroof', 29),
    (v_category_id, 'Plafon', 30),
    (v_category_id, 'Lampu Plafon', 31),
    (v_category_id, 'Speaker', 32),
    (v_category_id, 'Tuas Rem Tangan', 33),
    (v_category_id, 'Central Lock / Lock Pintu', 34),
    (v_category_id, 'Remote / Kunci', 35),
    (v_category_id, 'Kisi AC', 36),
    (v_category_id, 'Karpet', 37),
    (v_category_id, 'Pedal Rem', 38),
    (v_category_id, 'Pedal Gas', 39);

  ----------------------------------------------------------------
  -- KATEGORI 9: Ban
  ----------------------------------------------------------------
  insert into public.template_categories (template_id, name, sort_order)
  values (v_template_id, 'Ban', 9)
  returning id into v_category_id;

  insert into public.template_items (category_id, name, sort_order) values
    (v_category_id, 'Ban Cadangan', 1),
    (v_category_id, 'Kondisi Ban Belakang', 2),
    (v_category_id, 'Kondisi Ban Depan', 3),
    (v_category_id, 'Velg Belakang', 4),
    (v_category_id, 'Velg Depan', 5);

  ----------------------------------------------------------------
  -- KATEGORI 10: Sistem Pengereman
  ----------------------------------------------------------------
  insert into public.template_categories (template_id, name, sort_order)
  values (v_template_id, 'Sistem Pengereman', 10)
  returning id into v_category_id;

  insert into public.template_items (category_id, name, sort_order) values
    (v_category_id, 'Brake Pad', 1),
    (v_category_id, 'Discbrake', 2),
    (v_category_id, 'Drum / Tromol', 3),
    (v_category_id, 'Minyak Rem', 4);

  ----------------------------------------------------------------
  -- KATEGORI 11: Fitur
  ----------------------------------------------------------------
  insert into public.template_categories (template_id, name, sort_order)
  values (v_template_id, 'Fitur', 11)
  returning id into v_category_id;

  insert into public.template_items (category_id, name, sort_order) values
    (v_category_id, 'ADAS', 1),
    (v_category_id, 'Cruise Control', 2),
    (v_category_id, 'Idle Start Stop', 3),
    (v_category_id, 'Kunci Cadangan', 4),
    (v_category_id, 'Kunci Kontak', 5),
    (v_category_id, 'Lainnya', 6);

  ----------------------------------------------------------------
  -- KATEGORI 12: Steering
  ----------------------------------------------------------------
  insert into public.template_categories (template_id, name, sort_order)
  values (v_template_id, 'Steering', 12)
  returning id into v_category_id;

  insert into public.template_items (category_id, name, sort_order) values
    (v_category_id, 'EPS (Elektrik Power Steering)', 1),
    (v_category_id, 'Minyak Power Steering', 2),
    (v_category_id, 'Power Steering', 3),
    (v_category_id, 'Selang Power Steering', 4),
    (v_category_id, 'Steering Coloumn', 5);

  ----------------------------------------------------------------
  -- KATEGORI 13: No Rangka & Mesin
  ----------------------------------------------------------------
  insert into public.template_categories (template_id, name, sort_order)
  values (v_template_id, 'No Rangka & Mesin', 13)
  returning id into v_category_id;

  insert into public.template_items (category_id, name, sort_order) values
    (v_category_id, 'Dokumen Dengan Fisik', 1);

  ----------------------------------------------------------------
  -- KATEGORI 14: Kelengkapan Dokumen
  ----------------------------------------------------------------
  insert into public.template_categories (template_id, name, sort_order)
  values (v_template_id, 'Kelengkapan Dokumen', 14)
  returning id into v_category_id;

  insert into public.template_items (category_id, name, sort_order) values
    (v_category_id, 'BPKB', 1),
    (v_category_id, 'Buku Manual', 2),
    (v_category_id, 'Buku Service', 3),
    (v_category_id, 'Faktur', 4),
    (v_category_id, 'Form A', 5),
    (v_category_id, 'NIK', 6),
    (v_category_id, 'STNK', 7);

  raise notice 'Default template berhasil dibuat (id: %).', v_template_id;
end $$;
