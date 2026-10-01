import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";
import { db } from "../config/db.js";

export interface AppointmentFilters {
  date?: string;
  status?: string;
}

/** Finds an appointment with provider policy and service metadata. */
export async function findAppointmentById(id: number) {
  return db("appointments as a")
    .join("provider_profiles as p", "p.id", "a.provider_id")
    .join("services as s", "s.id", "a.service_id")
    .select(
      "a.*",
      "p.cancellation_hours",
      "p.timezone",
      "s.name as service_name",
    )
    .where("a.id", id)
    .first();
}

/** Runs the overlap query that prevents double-booking confirmed appointments. */
export async function findConflictingAppointments(
  providerId: number,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: number,
) {
  const query = db("appointments")
    .where({ provider_id: providerId, status: "confirmed" })
    .andWhere("start_time", "<", endTime)
    .andWhere("end_time", ">", startTime);

  if (excludeAppointmentId) query.andWhereNot({ id: excludeAppointmentId });
  return query;
}

/** Lists provider appointments, optionally narrowed by date and status. */
export async function listProviderAppointments(
  providerId: number,
  filters: AppointmentFilters,
) {
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
    .select(
      "a.*",
      "provider_user.name as provider_name",
      "s.name as service_name",
      "p.timezone",
    )
    .where("a.customer_id", customerId)
    .orderBy("a.start_time", "desc");
}

/** Creates a confirmed appointment after services verify policy and conflicts. */
export async function createAppointment(values: Record<string, unknown>) {
  return db.transaction(async (trx) => {
    const provider = await trx("provider_profiles")
      .where({ id: values.provider_id })
      .forUpdate()
      .first();
    if (!provider || !provider.is_accepting_bookings)
      throw new NotFoundError("Provider is not accepting bookings");
    await ensureNoConflict(trx, values);
    const [appointment] = await trx("appointments")
      .insert(values)
      .returning("*");
    await trx("notifications").insert({
      user_id: appointment.customer_id,
      appointment_id: appointment.id,
      type: "booking_confirmed",
      subject: "Booking confirmed",
      body: `Appointment ${appointment.id} is booking confirmed.`,
      sent_at: trx.fn.now(),
    });
    return appointment;
  });
}

/** All timing/status writes take the provider lock before testing overlaps. */
export async function updateAppointment(
  id: number,
  values: Record<string, unknown>,
) {
  return db.transaction(async (trx) => {
    const found = await trx("appointments").where({ id }).first();
    if (!found) throw new NotFoundError("Appointment not found");
    await trx("provider_profiles")
      .where({ id: found.provider_id })
      .forUpdate()
      .first();
    const before = await trx("appointments").where({ id }).forUpdate().first();
    const next = { ...before, ...values };
    if (next.status === "confirmed") await ensureNoConflict(trx, next, id);
    const [appointment] = await trx("appointments")
      .where({ id })
      .update({ ...values, updated_at: trx.fn.now() })
      .returning("*");
    return appointment;
  });
}
async function ensureNoConflict(
  trx: any,
  values: Record<string, any>,
  id?: number,
) {
  const start = new Date(values.start_time),
    end = new Date(values.end_time);
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    end <= start
  )
    throw new ValidationError(
      "Appointment must have a valid increasing time range",
    );
  const query = trx("appointments")
    .where({ provider_id: values.provider_id, status: "confirmed" })
    .where("start_time", "<", end)
    .where("end_time", ">", start);
  if (id) query.whereNot({ id });
  if (await query.first())
    throw new ConflictError("That time slot is no longer available");
}

/** Calculates provider dashboard counts and today's schedule. */
export async function getProviderDashboard(providerId: number) {
  const today = await listProviderAppointments(providerId, {
    date: new Date().toISOString().slice(0, 10),
  });
  const stats = await db("appointments")
    .where({ provider_id: providerId })
    .select("status")
    .count("id as count")
    .groupBy("status");
  return { today, stats };
}
