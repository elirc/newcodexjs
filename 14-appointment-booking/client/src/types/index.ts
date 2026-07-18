export interface Provider {
  id: number;
  user_id: number;
  name: string;
  email: string;
  specialty: string;
  bio: string;
  timezone: string;
  booking_buffer_minutes: number;
  advance_booking_days: number;
  cancellation_hours: number;
  service_count?: string;
  services?: Service[];
}

export interface Service {
  id: number;
  provider_id: number;
  name: string;
  description?: string;
  duration_minutes: number;
  price: string;
  is_active: boolean;
}

export interface Slot {
  startTime: string;
  endTime: string;
  label: string;
}

export interface Appointment {
  id: number;
  provider_id: number;
  customer_id: number;
  service_id: number;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  price: string;
  provider_name?: string;
  customer_name?: string;
  service_name?: string;
}

export interface AvailabilitySlot {
  id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}
