// ==========================================
// InpectPro — TypeScript Type Definitions
// ==========================================

// --- Enums & Constants ---

export type UserRole = 'super_admin' | 'inspector';

export type OrderStatus =
  | 'draft'
  | 'assigned'
  | 'in_progress'
  | 'pending_review'
  | 'completed'
  | 'cancelled';

export type ChecklistStatus = 'ok' | 'attention' | 'problem' | 'na';

export type Severity = 'ringan' | 'sedang' | 'berat';

export type TransmissionType = 'manual' | 'automatic';

export type FuelType = 'bensin' | 'diesel' | 'hybrid' | 'electric';

// --- User & Auth ---

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  avatar?: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

// --- Client ---

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

// --- Vehicle ---

export interface Vehicle {
  brand: string;
  model: string;
  type: string;
  year: number;
  plate_number: string;
  chassis_number: string;
  engine_number: string;
  odometer_km: number;
  odometer_photo?: string;
  color: string;
  transmission: TransmissionType;
  fuel_type: FuelType;
}

// --- Template ---

export interface InspectionTemplate {
  id: string;
  name: string;
  description?: string;
  is_archived: boolean;
  categories: TemplateCategory[];
  created_at: string;
  updated_at: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  order: number;
  items: TemplateItem[];
}

export interface TemplateItem {
  id: string;
  name: string;
  description?: string;
  photo_required: boolean;
  severity_required: boolean;
  order: number;
}

// --- Order ---

export interface Order {
  id: string;
  order_number: string;
  client: Client;
  vehicle: Vehicle;
  location: string;
  schedule_date: string;
  schedule_time: string;
  template_id: string;
  template_name: string;
  inspector_id: string;
  inspector_name: string;
  status: OrderStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// --- Inspection Result ---

export interface InspectionResult {
  order_id: string;
  vehicle: Vehicle;
  categories: InspectionCategory[];
  overall_score?: number;
  summary?: string;
  recommendation?: string;
  submitted_at?: string;
  reviewed_at?: string;
}

export interface InspectionCategory {
  id: string;
  name: string;
  order: number;
  items: InspectionItem[];
}

export interface InspectionItem {
  id: string;
  name: string;
  description?: string;
  status: ChecklistStatus;
  severity?: Severity;
  notes?: string;
  photos: string[];
  photo_required: boolean;
  severity_required: boolean;
}

// --- Stats ---

export interface DashboardStats {
  total_orders: number;
  orders_today: number;
  pending_review: number;
  completed_this_month: number;
  active_inspectors: number;
}

export interface InspectorStats {
  total_inspections: number;
  completed_this_month: number;
  average_duration_minutes: number;
  completion_rate: number;
}
