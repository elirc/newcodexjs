import { addMinutes, differenceInHours } from "date-fns";
import * as appointmentModel from "../models/appointmentModel";
import * as notificationModel from "../models/notificationModel";
import * as providerModel from "../models/providerModel";
import * as serviceModel from "../models/serviceModel";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors";

/** Creates notification rows for both sides of a booking event. */
async function notifyBooking(appointment: Record<string, unknown>, type: string, subject: string): Promise<void> {
  await notificationModel.createNotification({
    user_id: appointment.customer_id,
    appointment_id: appointment.id,
    type,
    subject,
    body: `Appointment ${appointment.id} is ${type.replace("_", " ")}.`,
    sent_at: new Date()
  });
}

/** Books an appointment after validating service ownership and overlap conflicts. */
export async function bookAppointment(customerId: number, input: { providerId: number; serviceId: number; startTime: string; notes?: string }) {
  const provider = await providerModel.findProviderById(input.providerId);
  if (!provider || !provider.is_accepting_bookings) throw new NotFoundError("Provider is not accepting bookings");
  const service = await serviceModel.findServiceById(input.serviceId);
  if (!service || service.provider_id !== input.providerId || !service.is_active) throw new NotFoundError("Service not found");

  const startTime = new Date(input.startTime);
  const endTime = addMinutes(startTime, service.duration_minutes);
  const conflicts = await appointmentModel.findConflictingAppointments(input.providerId, startTime, endTime);
  if (conflicts.length) throw new ConflictError("That time slot is no longer available");

  const appointment = await appointmentModel.createAppointment({
    provider_id: input.providerId,
    customer_id: customerId,
    service_id: input.serviceId,
    start_time: startTime,
    end_time: endTime,
    notes: input.notes,
    price: service.price
  });
  await notifyBooking(appointment, "booking_confirmed", "Booking confirmed");
  return appointment;
}

/** Lists the current customer's appointments. */
export async function listMyAppointments(customerId: number) {
  return appointmentModel.listCustomerAppointments(customerId);
}

/** Cancels a customer-owned appointment when provider policy allows it. */
export async function cancelCustomerAppointment(customerId: number, appointmentId: number, reason?: string) {
  const appointment = await appointmentModel.findAppointmentById(appointmentId);
  if (!appointment || appointment.customer_id !== customerId) throw new NotFoundError("Appointment not found");
  if (differenceInHours(new Date(appointment.start_time), new Date()) < appointment.cancellation_hours) {
    throw new ValidationError(`Cancellation requires at least ${appointment.cancellation_hours} hours notice`);
  }
  const updated = await appointmentModel.updateAppointment(appointmentId, { status: "cancelled_by_customer", cancellation_reason: reason });
  await notifyBooking(updated, "cancellation", "Appointment cancelled");
  return updated;
}

/** Reschedules a customer-owned appointment after re-running conflict detection. */
export async function rescheduleAppointment(customerId: number, appointmentId: number, startTimeValue: string) {
  const appointment = await appointmentModel.findAppointmentById(appointmentId);
  if (!appointment || appointment.customer_id !== customerId) throw new NotFoundError("Appointment not found");
  const service = await serviceModel.findServiceById(appointment.service_id);
  if (!service) throw new NotFoundError("Service not found");
  const startTime = new Date(startTimeValue);
  const endTime = addMinutes(startTime, service.duration_minutes);
  const conflicts = await appointmentModel.findConflictingAppointments(appointment.provider_id, startTime, endTime, appointmentId);
  if (conflicts.length) throw new ConflictError("New time conflicts with another appointment");
  return appointmentModel.updateAppointment(appointmentId, { start_time: startTime, end_time: endTime, status: "confirmed" });
}

/** Lists appointments owned by the current provider user. */
export async function listProviderAppointments(userId: number, filters: appointmentModel.AppointmentFilters) {
  const provider = await providerModel.findProviderByUserId(userId);
  if (!provider) throw new NotFoundError("Provider profile not found");
  return appointmentModel.listProviderAppointments(provider.id, filters);
}

/** Updates provider-owned appointment status for completion, no-show, or cancellation. */
export async function updateProviderAppointmentStatus(userId: number, appointmentId: number, status: string, reason?: string) {
  const provider = await providerModel.findProviderByUserId(userId);
  if (!provider) throw new NotFoundError("Provider profile not found");
  const appointment = await appointmentModel.findAppointmentById(appointmentId);
  if (!appointment || appointment.provider_id !== provider.id) throw new NotFoundError("Appointment not found");
  return appointmentModel.updateAppointment(appointmentId, { status, cancellation_reason: reason });
}

/** Returns today's provider schedule and status counts. */
export async function getProviderDashboard(userId: number) {
  const provider = await providerModel.findProviderByUserId(userId);
  if (!provider) throw new NotFoundError("Provider profile not found");
  return appointmentModel.getProviderDashboard(provider.id);
}
