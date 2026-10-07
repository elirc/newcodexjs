# Architecture

Appointment Booking is a two-sided app (customers book, providers manage availability) whose hard parts are time: wall-clock availability, UTC instants, and overlapping intervals. This document describes the code as it is; `path:line` references were checked on 2026-10-06.

## Backend

The Express app (`server/src/app.ts`) follows a controller/service/model split, with two routers mounted at `/api` (`app.ts:32-33`):

- Routes (`server/src/routes/appointmentRoutes.ts`, `providerRoutes.ts`) attach `validate({ body, query, params })` with Zod schemas from `server/src/validators/`.
- Controllers (`appointmentController.ts`, `providerController.ts`) read `req.user` and validated input and return the `{ success, data }` envelope via `utils/response.ts`.
- Services own business rules: slot calculation (`slotService.ts`), booking, cancellation policy, rescheduling and provider status changes (`appointmentService.ts`), and profile/service/availability management (`providerService.ts`).
- Models contain Knex queries. One exception to "queries only": `appointmentModel.ts` also owns the booking transaction, the provider row lock and the decisive conflict check (`ensureNoConflict`, `:127-149`), because those must run inside one transaction.
- Middleware: `requestContext.ts` (demo identity), `validate.ts` (Zod) and `errorMiddleware.ts` (error envelope).

## Data model

From `server/db/migrations/20260703140000_create_appointment_booking.ts`:

| Table (lines) | Key columns and constraints |
|---|---|
| `users` (5-11) | `email` unique, `role` with a `CHECK` customer/provider/admin added at `:126-128` |
| `provider_profiles` (13-30) | `user_id` unique, `timezone` default `America/New_York` (`:24`), `booking_buffer_minutes` default 15, `advance_booking_days` default 30, `cancellation_hours` default 24, `is_accepting_bookings` (`:25-28`) |
| `services` (32-47) | `duration_minutes` (`CHECK > 0`), `price` (`CHECK >= 0`), `is_active` |
| `availability` (49-61) | `day_of_week` (`CHECK 0-6`), `start_time`/`end_time` as SQL `time` (wall clock), unique `(provider_id, day_of_week, start_time)` |
| `availability_overrides` (63-77) | `override_date` date, optional `start_time`/`end_time`, `is_unavailable`, unique `(provider_id, override_date)` |
| `appointments` (79-103) | `start_time`/`end_time` `timestamp with time zone`, `status` default `confirmed` (`:98`) with a `CHECK` of five states (`:141-143`), `price` snapshot; index on `(provider_id, start_time, end_time)` (`:144-146`) |
| `notifications` (105-124) | `user_id`, `appointment_id` (`ON DELETE SET NULL`), `type`, `subject`, `body`, `is_read`, `sent_at` |

Weekly availability is wall-clock `time`; the provider's `timezone` decides how those times become UTC instants. Appointments store instants.

## Identity (as implemented)

`attachRequestContext` sets `req.user = { id, role }` from `x-user-id` (default 4) and `x-user-role` (default `customer`) (`requestContext.ts:9-14`). No server code reads `req.user.role`; provider routes find the provider through `providerModel.findProviderByUserId(req.user.id)` (for example `appointmentService.ts:134-135`), so "being a provider" means "your user id has a provider profile". The client sends user 4 by default (`client/src/services/api.ts:6-9`) and overrides the headers to user 1 for provider calls (for example `api.ts:49` for the dashboard).

## Slot calculation

`slotService.getAvailableSlots` (`slotService.ts:21-86`):

1. Load the provider and service; the service must belong to the provider and be active (`:26-31`).
2. Reject dates beyond `advance_booking_days` (`:33-41`).
3. An override for the date wins: `is_unavailable` returns no slots, otherwise its hours replace the weekly windows (`:43-50`). The weekday is taken from `new Date(date + "T12:00:00Z").getUTCDay()` (`:33`, `:49`).
4. Each window is converted from provider-local wall clock to UTC with `fromZonedTime(..., provider.timezone)` (`:55-62`).
5. Candidates step by `duration_minutes + booking_buffer_minutes` (`:78-81`); each is kept only if it is not in the past and `findConflictingAppointments` returns nothing (`:66-71`). Labels are formatted in the provider's zone (`:75`).

The overlap query (`appointmentModel.ts:29-42`) is the half-open test `start_time < newEnd AND end_time > newStart` against `status = 'confirmed'`, so back-to-back appointments do not conflict. It runs once per candidate slot.

## Request trace: booking an appointment (the core write)

1. The booking page posts `{ providerId, serviceId, startTime, notes }` through `bookAppointment` (`client/src/services/api.ts:33-35`).
2. `app.ts:15-25` parses JSON and rejects non-object bodies; `app.ts:27` attaches the demo user.
3. `appointmentRoutes.ts:15-19` runs `validate({ body: bookingBodySchema })` (`validators/appointmentValidators.ts:7-12`: positive ids, `startTime` as an ISO datetime string, `notes` up to 1000 characters).
4. `appointmentController.ts:7-16` calls `appointmentService.bookAppointment(req.user!.id, req.body)` and replies 201.
5. `appointmentService.ts:29-70` checks the provider is accepting bookings (`:38-40`), the service belongs to the provider and is active (`:41-47`), computes `endTime = startTime + duration_minutes` (`:49-50`), runs an early, advisory overlap check (`:51-57`) and calls `appointmentModel.createAppointment` without a `status` (`:59-67`), so the column default `confirmed` applies.
6. `appointmentModel.ts:81-103` opens a transaction, locks the provider row with `forUpdate()` (`:83-86`), re-checks `is_accepting_bookings`, runs `ensureNoConflict` (`:89`, `:127-149`), inserts the appointment (`:90-92`) and a `booking_confirmed` notification (`:93-100`). Concurrent bookings for one provider serialize on that lock; the test "concurrent bookings for one slot yield one appointment and one conflict" (`test/booking.test.ts:27`) pins it, and "notification insert failure rolls the booking back" (`:61`) proves atomicity.

## Senior findings (verified in source)

1. **Booking does not check availability.** `bookAppointment` validates provider, service and conflicts, but never checks that `startTime` falls inside the provider's weekly hours or an override, is in the future, or respects `advance_booking_days` (`appointmentService.ts:29-70`). Those rules live only in `slotService`, which the booking path does not call. A direct `POST /api/appointments` can book 03:00 on a closed day or in the past.
2. **The buffer is only cosmetic.** Slots are spaced by `booking_buffer_minutes` (`slotService.ts:78-81`), but neither overlap query includes the buffer (`appointmentModel.ts:35-38`, `:142-145`), so an API booking can sit flush against another appointment.
3. **Malformed input is a 500, not a 400.** `validate` calls `schema.parse(...)`, which throws a `ZodError` (`middleware/validate.ts:11-14`); `errorMiddleware` turns anything that is not an `AppError` into 500 "Unexpected server error" (`errorMiddleware.ts:11-12`), and nothing maps `ZodError`. A bad `startTime` therefore returns 500.
4. **No status state machine.** `rescheduleAppointment` always writes `status: "confirmed"` (`appointmentService.ts:122-126`) without looking at the current status, so a cancelled, completed or no-show appointment can be revived by rescheduling it; `updateProviderAppointmentStatus` (`:140-155`) likewise lets a provider mark a cancelled appointment `completed`. Rescheduling also ignores the `cancellation_hours` window that cancelling enforces (`:85-92`).

Also: the provider dashboard's "today" is the server's UTC date (`appointmentModel.ts:154`) compared with `start_time::date` in the database session's time zone (`:58`), not the provider's `timezone`; cancellation notifications are written after the status update, outside its transaction (`appointmentService.ts:93-97`).

## Debugging scenario

Symptom: a provider in `America/New_York` set Monday 09:00-17:00 but the slot list for a Monday starts at the wrong hour. Path: confirm the provider's `timezone` (`SELECT timezone FROM provider_profiles WHERE id = 1;`) and the availability row (`SELECT * FROM availability WHERE provider_id = 1 AND day_of_week = 1;`). Then follow `slotService.ts:55-62`: `localDateTime(date, "09:00:00")` becomes `fromZonedTime("2026-...T09:00:00", "America/New_York")`, which should be 13:00Z or 14:00Z depending on DST. If the labels look right but times are shifted in the UI, the client is formatting the ISO `startTime` in the browser's zone instead of using the server `label` (`:75`). If an override exists for that date (`availability_overrides`), it replaces the weekly window entirely (`:46-50`).

## Exercise ladder (junior to mid)

1. **Goal:** map identity. **Check:** `grep -rn "x-user-id\|x-user-role" server/src client/src` shows `requestContext.ts:9-10` and the client headers in `api.ts`, and `grep -rn "\.role" server/src` finds no authorization check.
2. **Goal:** prove the 500 on bad input. **Check:** reading `validate.ts:11` and `errorMiddleware.ts:11-12`, a `ZodError` is not an `AppError`. Run locally (needs Postgres): `curl -X POST localhost:4214/api/appointments -H "content-type: application/json" -d '{"providerId":1,"serviceId":1,"startTime":"nope"}'` returns 500 `APP_ERROR`.
3. **Goal:** map `ZodError` to 400. **Check:** `errorMiddleware` returns 400 `VALIDATION_ERROR` with the first issue's message for a `ZodError`; a new test posting a malformed `startTime` expects 400 and no row (`npm test` with `ASTRA_TEST_DATABASE_URL` set to an `astra_test_*` database, see `test/database.ts`).
4. **Goal:** make booking honor availability. **Check:** inside the model transaction, the requested start must equal one of `getAvailableSlots(...)` (or pass the same window/override/past/advance checks); a test booking 03:00 on a day with 09:00-17:00 availability expects 400.
5. **Goal:** add legal status transitions. **Check:** a transition table allows `confirmed` to `completed`, `no_show`, `cancelled_by_customer` or `cancelled_by_provider` only, and rescheduling a cancelled appointment returns 409 with the row unchanged.

## Frontend

The React app uses Vite, TypeScript, CSS Modules, Axios and React Query, with pages in `client/src/pages/` and feature components in `client/src/features/` (providers, booking, appointments, availability, calendar). The first screen is provider browsing; `ProviderSettingsPage` demonstrates recurring availability and overrides, and the customer and provider dashboards show the two sides of the marketplace.
