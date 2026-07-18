import axios from "axios";
import type { Appointment, AvailabilitySlot, Provider, Service, Slot } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4214/api",
  headers: {
    "x-user-id": "4",
    "x-user-role": "customer"
  }
});

/** Unwraps the server response envelope. */
function unwrap<T>(response: { data: { data: T } }): T {
  return response.data.data;
}

/** Fetches providers for the browse page. */
export async function fetchProviders(search = ""): Promise<Provider[]> {
  return unwrap(await api.get("/providers", { params: { search } }));
}

/** Fetches a provider profile with services. */
export async function fetchProvider(id: number): Promise<Provider> {
  return unwrap(await api.get(`/providers/${id}`));
}

/** Fetches available slots for provider, service, and date. */
export async function fetchSlots(providerId: number, serviceId: number, date: string): Promise<Slot[]> {
  return unwrap(await api.get(`/providers/${providerId}/available-slots`, { params: { serviceId, date } }));
}

/** Books an appointment for the development customer. */
export async function bookAppointment(input: { providerId: number; serviceId: number; startTime: string; notes?: string }): Promise<Appointment> {
  return unwrap(await api.post("/appointments", input));
}

/** Fetches appointments for the development customer. */
export async function fetchMyAppointments(): Promise<Appointment[]> {
  return unwrap(await api.get("/my/appointments"));
}

/** Cancels an appointment for the development customer. */
export async function cancelAppointment(id: number, reason: string): Promise<Appointment> {
  return unwrap(await api.patch(`/appointments/${id}/cancel`, { reason }));
}

/** Fetches provider dashboard using provider development headers. */
export async function fetchProviderDashboard(): Promise<{ today: Appointment[]; stats: Array<{ status: string; count: string }> }> {
  return unwrap(await api.get("/provider/dashboard", { headers: { "x-user-id": "1", "x-user-role": "provider" } }));
}

/** Fetches provider appointments using provider development headers. */
export async function fetchProviderAppointments(): Promise<Appointment[]> {
  return unwrap(await api.get("/provider/appointments", { headers: { "x-user-id": "1", "x-user-role": "provider" } }));
}

/** Fetches provider services using provider development headers. */
export async function fetchOwnServices(): Promise<Service[]> {
  return unwrap(await api.get("/provider/services", { headers: { "x-user-id": "1", "x-user-role": "provider" } }));
}

/** Fetches weekly availability using provider development headers. */
export async function fetchAvailability(): Promise<AvailabilitySlot[]> {
  return unwrap(await api.get("/provider/availability", { headers: { "x-user-id": "1", "x-user-role": "provider" } }));
}

/** Saves weekly availability using provider development headers. */
export async function saveAvailability(slots: AvailabilitySlot[]): Promise<AvailabilitySlot[]> {
  return unwrap(await api.put("/provider/availability", slots, { headers: { "x-user-id": "1", "x-user-role": "provider" } }));
}

/** Creates a date override using provider development headers. */
export async function createOverride(input: { override_date: string; is_unavailable: boolean; start_time?: string; end_time?: string; reason?: string }) {
  return unwrap(await api.post("/provider/overrides", input, { headers: { "x-user-id": "1", "x-user-role": "provider" } }));
}
