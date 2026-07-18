import { db } from "../config/db";

export interface AppointmentFilters {
  date?: string;
  status?: string;
}

/** Finds an appointment with provider policy and service metadata. */
export async function findAppointmentById(id: number) {
  return db("appointments as a")
    .join("provider_profiles as p", "p.id", "a.provider_id")
    .join("services as s", "s.id", "a.service_id")
    .select("a.*", "p.cancellation_hours", "p.timezone", "s.name as service_name")
    .where("a.id", id)
    .first();
}

/** Runs the overlap query that prevents double-booking confirmed appointments. */
export async function findConflictingAppointments(providerId: number, startTime: Date, endTime: Date, excludeAppointmentId?: number) {
  const query = db("appointments")
    .where({ provider_id: providerId, status: "confirmed" })
    .andWhere("start_time", "<", endTime)
    .andWhere("end_time", ">", startTime);

  if (excludeAppointmentId) query.andWhereNot({ id: excludeAppointmentId });
  return query;
}

/** Lists provider appointments, optionally narrowed by date and status. */
export async function listProviderAppointments(providerId: number, filters: AppointmentFilters) {
  const query = db("appointments as a")
    .join("users as u", "u.id", "a.customer_id")
    .join("services as s", "s.id", "a.service_id")
    .select("a.*", "u.name as customer_name", "s.name as service_name")
    .where("a.provider_id", providerId)
    .orderBy("a.start_time", "asc");

  if (filters.status) query.andWhere("a.status", filters.status);
  if (filters.date) {
    query.andWhereRaw("a.start_time::date = ?::date", [filters.date]);
  }

  return query;
}

/** Lists appointments for a customer dashboard. */
export async function listCustomerAppointments(customerId: number) {
  return db("appointments as a")
    .join("provider_profiles as p", "p.id", "a.provider_id")
    .join("users as provider_user", "provider_user.id", "p.user_id")
    .join("services as s", "s.id", "a.service_id")
    .select("a.*", "provider_user.name as provider_name", "s.name as service_name", "p.timezone")
    .where("a.customer_id", customerId)
    .orderBy("a.start_time", "desc");
}

/** Creates a confirmed appointment after services verify policy and conflicts. */
export async function createAppointment(values: Record<string, unknown>) {
  const [appointment] = await db("appointments").insert(values).returning("*");
  return appointment;
}

/** Updates appointment timing, status, or cancellation details. */
export async function updateAppointment(id: number, values: Record<string, unknown>) {
  const [appointment] = await db("appointments").where({ id }).update({ ...values, updated_at: db.fn.now() }).returning("*");
  return appointment;
}

/** Calculates provider dashboard counts and today's schedule. */
export async function getProviderDashboard(providerId: number) {
  const today = await listProviderAppointments(providerId, { date: new Date().toISOString().slice(0, 10) });
  const stats = await db("appointments").where({ provider_id: providerId }).select("status").count("id as count").groupBy("status");
  return { today, stats };
}
