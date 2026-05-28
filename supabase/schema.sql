-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Tabel Users (Super Admin & Inspektor)
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  username varchar(50) unique not null,
  name varchar(100) not null,
  role varchar(20) check (role in ('super_admin', 'inspector')) not null,
  phone varchar(20),
  email varchar(100),
  avatar text,
  is_active boolean default true not null,
  must_change_password boolean default false not null,
  password_hash varchar(255) not null,
  created_at timestamp with time zone default current_timestamp not null,
  updated_at timestamp with time zone default current_timestamp not null
);

-- Index untuk performa query pencarian username
create index if not exists users_username_idx on public.users (username);

-- 2. Tabel Klien
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  name varchar(100) not null,
  phone varchar(20) not null,
  email varchar(100),
  created_at timestamp with time zone default current_timestamp not null
);

-- 3. Tabel Templates
create table if not exists public.templates (
  id uuid primary key default uuid_generate_v4(),
  name varchar(100) not null,
  description text,
  is_archived boolean default false not null,
  is_default boolean default false not null,
  created_at timestamp with time zone default current_timestamp not null,
  updated_at timestamp with time zone default current_timestamp not null
);

-- 4. Tabel Template Categories
create table if not exists public.template_categories (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid references public.templates(id) on delete cascade not null,
  name varchar(100) not null,
  sort_order integer not null,
  created_at timestamp with time zone default current_timestamp not null
);

-- 5. Tabel Template Items
create table if not exists public.template_items (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.template_categories(id) on delete cascade not null,
  name varchar(100) not null,
  description text,
  photo_required boolean default true not null,
  severity_required boolean default true not null,
  sort_order integer not null,
  created_at timestamp with time zone default current_timestamp not null
);

-- 6. Tabel Orders
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  order_number varchar(50) unique not null,
  client_id uuid references public.clients(id) on delete restrict not null,
  location text not null,
  schedule_date date not null,
  schedule_time time not null,
  template_id uuid references public.templates(id) on delete restrict not null,
  inspector_id uuid references public.users(id) on delete restrict not null,
  status varchar(20) check (status in ('draft', 'assigned', 'in_progress', 'pending_review', 'completed')) default 'draft' not null,
  notes text,
  
  -- Vehicle Embedded Fields
  vehicle_brand varchar(50) not null,
  vehicle_model varchar(50) not null,
  vehicle_type varchar(50) not null,
  vehicle_year integer not null,
  vehicle_plate_number varchar(20) not null,
  vehicle_chassis_number varchar(50) not null,
  vehicle_engine_number varchar(50) not null,
  vehicle_odometer_km integer not null,
  vehicle_odometer_photo text,
  vehicle_color varchar(30) not null,
  vehicle_transmission varchar(20) check (vehicle_transmission in ('manual', 'automatic')) not null,
  vehicle_fuel_type varchar(20) check (vehicle_fuel_type in ('bensin', 'diesel', 'hybrid', 'electric')) not null,
  
  created_at timestamp with time zone default current_timestamp not null,
  updated_at timestamp with time zone default current_timestamp not null
);

-- Index untuk filter status dan jadwal
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_inspector_idx on public.orders (inspector_id);
create index if not exists orders_schedule_date_idx on public.orders (schedule_date);

-- 7. Tabel Hasil Review Inspeksi (Skor & Ringkasan Laporan)
create table if not exists public.inspection_results (
  order_id uuid primary key references public.orders(id) on delete cascade,
  overall_score integer check (overall_score between 0 and 100),
  summary text,
  recommendation text,
  submitted_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default current_timestamp not null,
  updated_at timestamp with time zone default current_timestamp not null
);

-- 8. Tabel Nilai Checklist Titik Inspeksi per Order
create table if not exists public.inspection_checklist_values (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  category_id uuid not null,
  category_name varchar(100) not null,
  item_id uuid not null,
  item_name varchar(100) not null,
  status varchar(20) check (status in ('ok', 'attention', 'problem', 'na')) not null,
  severity varchar(20) check (severity in ('ringan', 'sedang', 'berat')),
  notes text,
  photos text[] default '{}'::text[] not null, -- Daftar URL foto
  sort_order integer not null,
  photo_required boolean default true not null,
  severity_required boolean default true not null,
  created_at timestamp with time zone default current_timestamp not null,
  updated_at timestamp with time zone default current_timestamp not null,
  unique (order_id, item_id)
);

create index if not exists checklist_values_order_idx on public.inspection_checklist_values (order_id);

-- Seeding Default Super Admin
-- Username: arya | Password: macbookPro13 (Bcrypt Hash di bawah)
insert into public.users (username, name, role, is_active, must_change_password, password_hash)
values (
  'arya',
  'Arya Pratama',
  'super_admin',
  true,
  true, -- Wajib ganti password saat login pertama kali
  '$2b$10$s9uagpdzgI/j/6aFJIxBYewW3O/tngtoN6sB7oCeVU06Ss4VkbTdm'
) on conflict (username) do nothing;
