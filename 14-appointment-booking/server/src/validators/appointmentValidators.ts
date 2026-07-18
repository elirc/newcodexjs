import { z } from "zod";

export const appointmentIdParamsSchema = z.object({ id: z.coerce.number().int().positive() });

export const bookingBodySchema = z.object({
  providerId: z.number().int().positive(),
  serviceId: z.number().int().positive(),
  startTime: z.string().datetime(),
  notes: z.string().max(1000).optional()
});

export const cancelBodySchema = z.object({
  reason: z.string().max(1000).optional()
});

export const rescheduleBodySchema = z.object({
  startTime: z.string().datetime()
});

export const providerAppointmentsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(["confirmed", "cancelled_by_customer", "cancelled_by_provider", "completed", "no_show"]).optional()
});
