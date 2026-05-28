// ==========================================
// InpectPro — Mock Data for UI Development
// ==========================================

import {
  Order,
  User,
  InspectionTemplate,
  DashboardStats,
  InspectionResult,
  InspectorStats,
} from './types';

// --- Users ---

export const mockSuperAdmin: User = {
  id: 'usr-001',
  username: 'arya',
  name: 'Arya Pratama',
  role: 'super_admin',
  phone: '081234567890',
  email: 'arya@inpectpro.id',
  is_active: true,
  must_change_password: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-05-27T00:00:00Z',
};

export const mockInspectors: User[] = [
  {
    id: 'usr-002',
    username: 'budi.inspector',
    name: 'Budi Santoso',
    role: 'inspector',
    phone: '081298765432',
    email: 'budi@inpectpro.id',
    is_active: true,
    must_change_password: false,
    created_at: '2026-02-15T00:00:00Z',
    updated_at: '2026-05-20T00:00:00Z',
  },
  {
    id: 'usr-003',
    username: 'rina.inspector',
    name: 'Rina Wulandari',
    role: 'inspector',
    phone: '081355566677',
    email: 'rina@inpectpro.id',
    is_active: true,
    must_change_password: false,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-05-25T00:00:00Z',
  },
  {
    id: 'usr-004',
    username: 'deni.inspector',
    name: 'Deni Firmansyah',
    role: 'inspector',
    phone: '081277788899',
    is_active: true,
    must_change_password: false,
    created_at: '2026-03-10T00:00:00Z',
    updated_at: '2026-05-18T00:00:00Z',
  },
  {
    id: 'usr-005',
    username: 'sari.inspector',
    name: 'Sari Indah',
    role: 'inspector',
    phone: '081399988877',
    is_active: false,
    must_change_password: false,
    created_at: '2026-02-20T00:00:00Z',
    updated_at: '2026-04-10T00:00:00Z',
  },
];

// --- Templates ---

export const mockTemplates: InspectionTemplate[] = [
  {
    id: 'tmpl-001',
    name: 'Inspeksi Standar',
    description: 'Template inspeksi lengkap untuk mobil bekas — mencakup eksterior, interior, mesin, kaki-kaki, dan dokumen.',
    is_archived: false,
    categories: [
      {
        id: 'cat-001',
        name: 'Eksterior',
        order: 1,
        items: [
          { id: 'item-001', name: 'Body panel depan', description: 'Cek penyok, gores, repaint', photo_required: true, severity_required: true, order: 1 },
          { id: 'item-002', name: 'Body panel samping kiri', description: 'Cek penyok, gores, repaint', photo_required: true, severity_required: true, order: 2 },
          { id: 'item-003', name: 'Body panel samping kanan', description: 'Cek penyok, gores, repaint', photo_required: true, severity_required: true, order: 3 },
          { id: 'item-004', name: 'Body panel belakang', description: 'Cek penyok, gores, repaint', photo_required: true, severity_required: true, order: 4 },
          { id: 'item-005', name: 'Lampu depan', description: 'Fungsi, kondisi lensa', photo_required: true, severity_required: true, order: 5 },
          { id: 'item-006', name: 'Lampu belakang', description: 'Fungsi, kondisi lensa', photo_required: true, severity_required: true, order: 6 },
          { id: 'item-007', name: 'Kaca depan', description: 'Retak, baret, chip', photo_required: true, severity_required: true, order: 7 },
          { id: 'item-008', name: 'Ban & velg', description: 'Kedalaman kembang, kondisi velg', photo_required: true, severity_required: true, order: 8 },
        ],
      },
      {
        id: 'cat-002',
        name: 'Interior',
        order: 2,
        items: [
          { id: 'item-009', name: 'Jok depan', description: 'Kondisi bahan, sobek, noda', photo_required: true, severity_required: true, order: 1 },
          { id: 'item-010', name: 'Jok belakang', description: 'Kondisi bahan, sobek, noda', photo_required: true, severity_required: true, order: 2 },
          { id: 'item-011', name: 'Dashboard', description: 'Kondisi panel, retakan', photo_required: true, severity_required: false, order: 3 },
          { id: 'item-012', name: 'AC', description: 'Fungsi pendingin, bau', photo_required: false, severity_required: true, order: 4 },
          { id: 'item-013', name: 'Audio & head unit', description: 'Fungsi speaker, layar', photo_required: false, severity_required: false, order: 5 },
          { id: 'item-014', name: 'Power window', description: 'Fungsi semua jendela', photo_required: false, severity_required: true, order: 6 },
        ],
      },
      {
        id: 'cat-003',
        name: 'Mesin',
        order: 3,
        items: [
          { id: 'item-015', name: 'Suara mesin idle', description: 'Getaran abnormal, suara tidak wajar', photo_required: false, severity_required: true, order: 1 },
          { id: 'item-016', name: 'Oli mesin', description: 'Warna, level, kebocoran', photo_required: true, severity_required: true, order: 2 },
          { id: 'item-017', name: 'Radiator & coolant', description: 'Level, kebocoran, warna', photo_required: true, severity_required: true, order: 3 },
          { id: 'item-018', name: 'Belt & selang', description: 'Kondisi karet, retakan', photo_required: true, severity_required: true, order: 4 },
          { id: 'item-019', name: 'Aki', description: 'Kondisi terminal, usia', photo_required: true, severity_required: true, order: 5 },
        ],
      },
      {
        id: 'cat-004',
        name: 'Kaki-kaki',
        order: 4,
        items: [
          { id: 'item-020', name: 'Shock absorber', description: 'Kebocoran, respons', photo_required: false, severity_required: true, order: 1 },
          { id: 'item-021', name: 'Rem depan', description: 'Ketebalan kampas, cakram', photo_required: true, severity_required: true, order: 2 },
          { id: 'item-022', name: 'Rem belakang', description: 'Ketebalan kampas, tromol/cakram', photo_required: true, severity_required: true, order: 3 },
          { id: 'item-023', name: 'Bearing roda', description: 'Bunyi, keolengan', photo_required: false, severity_required: true, order: 4 },
        ],
      },
      {
        id: 'cat-005',
        name: 'Test Drive',
        order: 5,
        items: [
          { id: 'item-024', name: 'Perpindahan gigi', description: 'Halus, tidak tersendat', photo_required: false, severity_required: true, order: 1 },
          { id: 'item-025', name: 'Kemudi', description: 'Respons, getaran, bunyi', photo_required: false, severity_required: true, order: 2 },
          { id: 'item-026', name: 'Pengereman', description: 'Respons, jarak henti, ABS', photo_required: false, severity_required: true, order: 3 },
        ],
      },
      {
        id: 'cat-006',
        name: 'Dokumen',
        order: 6,
        items: [
          { id: 'item-027', name: 'STNK', description: 'Kecocokan data, masa berlaku', photo_required: true, severity_required: false, order: 1 },
          { id: 'item-028', name: 'BPKB', description: 'Kecocokan data', photo_required: true, severity_required: false, order: 2 },
          { id: 'item-029', name: 'Faktur', description: 'Ada/tidak', photo_required: true, severity_required: false, order: 3 },
          { id: 'item-030', name: 'NIK (KTP pemilik)', description: 'Kecocokan dengan dokumen', photo_required: true, severity_required: false, order: 4 },
        ],
      },
    ],
    created_at: '2026-02-01T00:00:00Z',
    updated_at: '2026-05-20T00:00:00Z',
  },
  {
    id: 'tmpl-002',
    name: 'Inspeksi Cepat',
    description: 'Template ringkas untuk pengecekan cepat — fokus pada eksterior, mesin, dan dokumen saja.',
    is_archived: false,
    categories: [
      {
        id: 'cat-007',
        name: 'Eksterior',
        order: 1,
        items: [
          { id: 'item-031', name: 'Body keseluruhan', description: 'Kondisi umum body', photo_required: true, severity_required: true, order: 1 },
          { id: 'item-032', name: 'Lampu-lampu', description: 'Fungsi semua lampu', photo_required: false, severity_required: true, order: 2 },
          { id: 'item-033', name: 'Ban', description: 'Kondisi umum 4 ban', photo_required: true, severity_required: true, order: 3 },
        ],
      },
      {
        id: 'cat-008',
        name: 'Mesin',
        order: 2,
        items: [
          { id: 'item-034', name: 'Kondisi umum mesin', description: 'Suara, getaran, kebocoran', photo_required: true, severity_required: true, order: 1 },
          { id: 'item-035', name: 'Oli & cairan', description: 'Level dan kondisi', photo_required: false, severity_required: true, order: 2 },
        ],
      },
      {
        id: 'cat-009',
        name: 'Dokumen',
        order: 3,
        items: [
          { id: 'item-036', name: 'STNK & BPKB', description: 'Kelengkapan dokumen', photo_required: true, severity_required: false, order: 1 },
        ],
      },
    ],
    created_at: '2026-03-15T00:00:00Z',
    updated_at: '2026-05-22T00:00:00Z',
  },
  {
    id: 'tmpl-003',
    name: 'Inspeksi Premium',
    description: 'Template inspeksi paling detail — termasuk kolong dan semua komponen.',
    is_archived: true,
    categories: [],
    created_at: '2026-01-20T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  },
];

// --- Orders ---

export const mockOrders: Order[] = [
  {
    id: 'ord-001',
    order_number: 'INP-2026-001',
    client: { id: 'cli-001', name: 'Ahmad Wijaya', phone: '081200001111', email: 'ahmad@gmail.com' },
    vehicle: {
      brand: 'Toyota', model: 'Avanza', type: '1.5 G AT', year: 2022,
      plate_number: 'B 1234 XYZ', chassis_number: 'MHFM1BA3J...',
      engine_number: '2NR-FE...', odometer_km: 45000, color: 'Putih',
      transmission: 'automatic', fuel_type: 'bensin',
    },
    location: 'Jl. Sudirman No. 45, Jakarta Selatan',
    schedule_date: '2026-05-28',
    schedule_time: '09:00',
    template_id: 'tmpl-001',
    template_name: 'Inspeksi Standar',
    inspector_id: 'usr-002',
    inspector_name: 'Budi Santoso',
    status: 'in_progress',
    created_at: '2026-05-27T08:00:00Z',
    updated_at: '2026-05-28T09:15:00Z',
  },
  {
    id: 'ord-002',
    order_number: 'INP-2026-002',
    client: { id: 'cli-002', name: 'Siti Rahayu', phone: '081333444555' },
    vehicle: {
      brand: 'Honda', model: 'Jazz', type: 'RS CVT', year: 2021,
      plate_number: 'D 5678 ABC', chassis_number: 'MHRGE8...',
      engine_number: 'L15B7...', odometer_km: 32000, color: 'Merah',
      transmission: 'automatic', fuel_type: 'bensin',
    },
    location: 'Jl. Asia Afrika No. 12, Bandung',
    schedule_date: '2026-05-28',
    schedule_time: '14:00',
    template_id: 'tmpl-001',
    template_name: 'Inspeksi Standar',
    inspector_id: 'usr-003',
    inspector_name: 'Rina Wulandari',
    status: 'assigned',
    created_at: '2026-05-27T10:00:00Z',
    updated_at: '2026-05-27T10:00:00Z',
  },
  {
    id: 'ord-003',
    order_number: 'INP-2026-003',
    client: { id: 'cli-003', name: 'Hendra Kurniawan', phone: '081666777888', email: 'hendra.k@yahoo.com' },
    vehicle: {
      brand: 'Mitsubishi', model: 'Xpander', type: 'Ultimate AT', year: 2023,
      plate_number: 'F 9012 DEF', chassis_number: 'MMBMRKK...',
      engine_number: '4A91...', odometer_km: 18000, color: 'Hitam',
      transmission: 'automatic', fuel_type: 'bensin',
    },
    location: 'Jl. Diponegoro No. 78, Bogor',
    schedule_date: '2026-05-29',
    schedule_time: '10:00',
    template_id: 'tmpl-002',
    template_name: 'Inspeksi Cepat',
    inspector_id: 'usr-002',
    inspector_name: 'Budi Santoso',
    status: 'draft',
    created_at: '2026-05-27T15:00:00Z',
    updated_at: '2026-05-27T15:00:00Z',
  },
  {
    id: 'ord-004',
    order_number: 'INP-2026-004',
    client: { id: 'cli-004', name: 'Dewi Lestari', phone: '081444555666' },
    vehicle: {
      brand: 'Suzuki', model: 'Ertiga', type: 'GX MT', year: 2020,
      plate_number: 'A 3456 GHI', chassis_number: 'MHYESL...',
      engine_number: 'K15B...', odometer_km: 67000, color: 'Silver',
      transmission: 'manual', fuel_type: 'bensin',
    },
    location: 'Jl. Pemuda No. 33, Serang',
    schedule_date: '2026-05-27',
    schedule_time: '11:00',
    template_id: 'tmpl-001',
    template_name: 'Inspeksi Standar',
    inspector_id: 'usr-004',
    inspector_name: 'Deni Firmansyah',
    status: 'pending_review',
    created_at: '2026-05-26T09:00:00Z',
    updated_at: '2026-05-27T13:00:00Z',
  },
  {
    id: 'ord-005',
    order_number: 'INP-2026-005',
    client: { id: 'cli-005', name: 'Rudi Hartono', phone: '081777888999', email: 'rudi.h@outlook.com' },
    vehicle: {
      brand: 'Daihatsu', model: 'Terios', type: 'R AT DLX', year: 2019,
      plate_number: 'B 7890 JKL', chassis_number: 'MHKG...',
      engine_number: '2NR-VE...', odometer_km: 82000, color: 'Coklat',
      transmission: 'automatic', fuel_type: 'bensin',
    },
    location: 'Jl. Gatot Subroto No. 100, Jakarta Selatan',
    schedule_date: '2026-05-25',
    schedule_time: '09:00',
    template_id: 'tmpl-001',
    template_name: 'Inspeksi Standar',
    inspector_id: 'usr-003',
    inspector_name: 'Rina Wulandari',
    status: 'completed',
    created_at: '2026-05-24T08:00:00Z',
    updated_at: '2026-05-25T15:00:00Z',
  },
  {
    id: 'ord-006',
    order_number: 'INP-2026-006',
    client: { id: 'cli-006', name: 'Fajar Nugroho', phone: '081888999000' },
    vehicle: {
      brand: 'Nissan', model: 'Livina', type: 'VE AT', year: 2021,
      plate_number: 'B 2345 MNO', chassis_number: 'MHBL...',
      engine_number: 'HR15...', odometer_km: 41000, color: 'Abu-abu',
      transmission: 'automatic', fuel_type: 'bensin',
    },
    location: 'Jl. TB Simatupang No. 55, Jakarta Timur',
    schedule_date: '2026-05-26',
    schedule_time: '13:00',
    template_id: 'tmpl-002',
    template_name: 'Inspeksi Cepat',
    inspector_id: 'usr-002',
    inspector_name: 'Budi Santoso',
    status: 'completed',
    created_at: '2026-05-25T07:00:00Z',
    updated_at: '2026-05-26T16:00:00Z',
  },
];

// --- Dashboard Stats ---

export const mockAdminStats: DashboardStats = {
  total_orders: 47,
  orders_today: 2,
  pending_review: 3,
  completed_this_month: 18,
  active_inspectors: 3,
};

// --- Inspector Stats ---

export const mockInspectorStatsMap: Record<string, InspectorStats> = {
  'usr-002': { total_inspections: 24, completed_this_month: 8, average_duration_minutes: 38, completion_rate: 96 },
  'usr-003': { total_inspections: 19, completed_this_month: 7, average_duration_minutes: 42, completion_rate: 100 },
  'usr-004': { total_inspections: 12, completed_this_month: 3, average_duration_minutes: 51, completion_rate: 88 },
  'usr-005': { total_inspections: 5, completed_this_month: 0, average_duration_minutes: 55, completion_rate: 80 },
};

// --- Inspection Result (for review page) ---

export const mockInspectionResult: InspectionResult = {
  order_id: 'ord-004',
  vehicle: mockOrders[3].vehicle,
  categories: [
    {
      id: 'cat-001', name: 'Eksterior', order: 1,
      items: [
        { id: 'item-001', name: 'Body panel depan', status: 'ok', photos: ['/mock/photo-1.jpg'], photo_required: true, severity_required: true },
        { id: 'item-002', name: 'Body panel samping kiri', status: 'attention', severity: 'ringan', notes: 'Ada gores kecil di pintu depan kiri, kemungkinan bekas parkir.', photos: ['/mock/photo-2.jpg'], photo_required: true, severity_required: true },
        { id: 'item-003', name: 'Body panel samping kanan', status: 'ok', photos: ['/mock/photo-3.jpg'], photo_required: true, severity_required: true },
        { id: 'item-004', name: 'Body panel belakang', status: 'ok', photos: ['/mock/photo-4.jpg'], photo_required: true, severity_required: true },
        { id: 'item-005', name: 'Lampu depan', status: 'ok', photos: [], photo_required: true, severity_required: true },
        { id: 'item-006', name: 'Lampu belakang', status: 'ok', photos: [], photo_required: true, severity_required: true },
        { id: 'item-007', name: 'Kaca depan', status: 'attention', severity: 'ringan', notes: 'Chip kecil di sudut kanan bawah.', photos: ['/mock/photo-5.jpg'], photo_required: true, severity_required: true },
        { id: 'item-008', name: 'Ban & velg', status: 'problem', severity: 'sedang', notes: 'Ban depan kiri sudah tipis, perlu diganti dalam waktu dekat.', photos: ['/mock/photo-6.jpg'], photo_required: true, severity_required: true },
      ],
    },
    {
      id: 'cat-002', name: 'Interior', order: 2,
      items: [
        { id: 'item-009', name: 'Jok depan', status: 'ok', photos: ['/mock/photo-7.jpg'], photo_required: true, severity_required: true },
        { id: 'item-010', name: 'Jok belakang', status: 'ok', photos: [], photo_required: true, severity_required: true },
        { id: 'item-011', name: 'Dashboard', status: 'ok', photos: [], photo_required: true, severity_required: false },
        { id: 'item-012', name: 'AC', status: 'ok', notes: 'Dingin normal.', photos: [], photo_required: false, severity_required: true },
        { id: 'item-013', name: 'Audio & head unit', status: 'na', photos: [], photo_required: false, severity_required: false },
        { id: 'item-014', name: 'Power window', status: 'ok', photos: [], photo_required: false, severity_required: true },
      ],
    },
    {
      id: 'cat-003', name: 'Mesin', order: 3,
      items: [
        { id: 'item-015', name: 'Suara mesin idle', status: 'ok', notes: 'Halus, tidak ada getaran berlebih.', photos: [], photo_required: false, severity_required: true },
        { id: 'item-016', name: 'Oli mesin', status: 'attention', severity: 'ringan', notes: 'Warna sudah agak gelap, mendekati jadwal ganti oli.', photos: ['/mock/photo-8.jpg'], photo_required: true, severity_required: true },
        { id: 'item-017', name: 'Radiator & coolant', status: 'ok', photos: [], photo_required: true, severity_required: true },
        { id: 'item-018', name: 'Belt & selang', status: 'ok', photos: [], photo_required: true, severity_required: true },
        { id: 'item-019', name: 'Aki', status: 'ok', photos: [], photo_required: true, severity_required: true },
      ],
    },
    {
      id: 'cat-004', name: 'Kaki-kaki', order: 4,
      items: [
        { id: 'item-020', name: 'Shock absorber', status: 'ok', photos: [], photo_required: false, severity_required: true },
        { id: 'item-021', name: 'Rem depan', status: 'ok', photos: [], photo_required: true, severity_required: true },
        { id: 'item-022', name: 'Rem belakang', status: 'attention', severity: 'ringan', notes: 'Kampas rem mulai tipis, masih aman tapi perlu ganti dalam 5.000 km.', photos: [], photo_required: true, severity_required: true },
        { id: 'item-023', name: 'Bearing roda', status: 'ok', photos: [], photo_required: false, severity_required: true },
      ],
    },
    {
      id: 'cat-005', name: 'Test Drive', order: 5,
      items: [
        { id: 'item-024', name: 'Perpindahan gigi', status: 'ok', notes: 'Halus di semua gigi.', photos: [], photo_required: false, severity_required: true },
        { id: 'item-025', name: 'Kemudi', status: 'ok', photos: [], photo_required: false, severity_required: true },
        { id: 'item-026', name: 'Pengereman', status: 'ok', photos: [], photo_required: false, severity_required: true },
      ],
    },
    {
      id: 'cat-006', name: 'Dokumen', order: 6,
      items: [
        { id: 'item-027', name: 'STNK', status: 'ok', notes: 'Data cocok, berlaku hingga 2027.', photos: ['/mock/photo-9.jpg'], photo_required: true, severity_required: false },
        { id: 'item-028', name: 'BPKB', status: 'ok', photos: ['/mock/photo-10.jpg'], photo_required: true, severity_required: false },
        { id: 'item-029', name: 'Faktur', status: 'ok', photos: [], photo_required: true, severity_required: false },
        { id: 'item-030', name: 'NIK (KTP pemilik)', status: 'ok', photos: [], photo_required: true, severity_required: false },
      ],
    },
  ],
  overall_score: 82,
  summary: 'Kondisi mobil secara umum baik. Ada beberapa temuan minor di eksterior (gores dan chip kaca) dan ban depan kiri yang perlu diganti. Mesin dan kaki-kaki dalam kondisi baik. Dokumen lengkap.',
  recommendation: 'Mobil layak beli dengan catatan: (1) Ganti ban depan kiri, (2) Perbaiki chip kaca depan, (3) Servis ganti oli segera. Estimasi biaya perbaikan: Rp 2-3 juta.',
  submitted_at: '2026-05-27T13:00:00Z',
};

// --- Helpers ---

export function getOrdersByStatus(status: string) {
  return mockOrders.filter((o) => o.status === status);
}

export function getOrdersByInspector(inspectorId: string) {
  return mockOrders.filter((o) => o.inspector_id === inspectorId);
}

export function getOrderById(id: string) {
  return mockOrders.find((o) => o.id === id);
}

export function getTemplateById(id: string) {
  return mockTemplates.find((t) => t.id === id);
}

export function getInspectorById(id: string) {
  return mockInspectors.find((i) => i.id === id);
}

export const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-slate-600', bg: 'bg-slate-100' },
  assigned: { label: 'Ditugaskan', color: 'text-blue-700', bg: 'bg-blue-50' },
  in_progress: { label: 'Sedang Dikerjakan', color: 'text-amber-700', bg: 'bg-amber-50' },
  pending_review: { label: 'Menunggu Review', color: 'text-purple-700', bg: 'bg-purple-50' },
  completed: { label: 'Selesai', color: 'text-green-700', bg: 'bg-green-50' },
};
