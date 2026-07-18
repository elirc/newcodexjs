import { z } from "zod";

export const idParamsSchema = z.object({ id: z.coerce.number().int().positive() });
export const serviceParamsSchema = z.object({ id: z.coerce.number().int().positive() });
export const overrideParamsSchema = z.object({ id: z.coerce.number().int().positive() });

export const providerListQuerySchema = z.object({
  search: z.string().optional(),
  specialty: z.string().optional()
});

export const slotsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceId: z.coerce.number().int().positive()
});

export const profileBodySchema = z.object({
  specialty: z.string().max(100).nullable().optional(),
  bio: z.string().nullable().optional(),
  timezone: z.string().min(1).optional(),
  booking_buffer_minutes: z.number().int().min(0).optional(),
  advance_booking_days: z.number().int().min(1).max(365).optional(),
  cancellation_hours: z.number().int().min(0).max(168).optional(),
  is_accepting_bookings: z.boolean().optional()
});

export const serviceBodySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  duration_minutes: z.number().int().positive(),
  price: z.number().min(0),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional()
});

export const availabilityBodySchema = z.array(
  z.object({
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/)
  })
);

export const overrideBodySchema = z.object({
  override_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_unavailable: z.boolean().default(true),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  reason: z.string().max(200).nullable().optional()
});
