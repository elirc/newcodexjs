import { addMinutes, isBefore } from "date-fns";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import * as availabilityModel from "../models/availabilityModel.js";
import * as appointmentModel from "../models/appointmentModel.js";
import * as providerModel from "../models/providerModel.js";
import * as serviceModel from "../models/serviceModel.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";

export interface Slot {
  startTime: string;
  endTime: string;
  label: string;
}

/** Builds the local datetime string that date-fns-tz converts into UTC. */
function localDateTime(date: string, time: string): string {
  return `${date}T${time.length === 5 ? `${time}:00` : time}`;
}

/** Calculates available appointment slots by combining weekly hours, overrides, and conflicts. */
export async function getAvailableSlots(
  providerId: number,
  date: string,
  serviceId: number,
): Promise<Slot[]> {
  const provider = await providerModel.findProviderById(providerId);
  if (!provider) throw new NotFoundError("Provider not found");

  const service = await serviceModel.findServiceById(serviceId);
  if (!service || service.provider_id !== providerId || !service.is_active)
    throw new NotFoundError("Service not found for provider");

  const requestedDate = new Date(`${date}T12:00:00Z`);
  const maxDate = addMinutes(
    new Date(),
    provider.advance_booking_days * 24 * 60,
  );
  if (requestedDate > maxDate)
    throw new ValidationError(
      `Bookings are limited to ${provider.advance_booking_days} days in advance`,
    );

  const override = await availabilityModel.findOverride(providerId, date);
  if (override?.is_unavailable) return [];

  const windows = override
    ? [{ start_time: override.start_time, end_time: override.end_time }]
    : (await availabilityModel.listAvailability(providerId)).filter(
        (slot) => slot.day_of_week === requestedDate.getUTCDay(),
      );

  const slots: Slot[] = [];
  for (const window of windows) {
    if (!window.start_time || !window.end_time) continue;
    let start = fromZonedTime(
      localDateTime(date, window.start_time),
      provider.timezone,
    );
    const windowEnd = fromZonedTime(
      localDateTime(date, window.end_time),
      provider.timezone,
    );

    while (addMinutes(start, service.duration_minutes) <= windowEnd) {
      const end = addMinutes(start, service.duration_minutes);
      const conflicts = await appointmentModel.findConflictingAppointments(
        providerId,
        start,
        end,
      );
      if (!conflicts.length && !isBefore(start, new Date())) {
        slots.push({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          label: formatInTimeZone(start, provider.timezone, "h:mm a zzz"),
        });
      }
      start = addMinutes(
        start,
        service.duration_minutes + provider.booking_buffer_minutes,
      );
    }
  }

  return slots;
}
