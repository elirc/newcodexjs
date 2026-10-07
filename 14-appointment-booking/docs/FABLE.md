# FABLE Guide — Appointment Booking System

**Project 14: time is the boss fight.** Booking is the domain where correct-looking
code is wrong in ways users notice: a slot shown twice, a 9:00 that's actually 8:00
because of DST, two customers booked into the same chair. This project is fully built —
recurring weekly availability, date overrides, slot generation, conflict detection,
booking/cancellation/reschedule policies, timezone conversion via `date-fns-tz`, and
notifications as database rows. Your job is to read it like a skeptic: the algorithms
here (interval math, slot generation) are the most interview-transferable code in the
whole curriculum.

---

## 1. What is new in this project

| Pattern | Where it lives | Why it matters |
|---|---|---|
| Slot generation | `server/src/services/slotService.ts` | Recurring weekly windows + per-date overrides + existing appointments + service duration → available start times. An algorithm, not a query. |
| Interval conflict detection | slot/appointment services | The overlap predicate `(startA < endB && startB < endA)` and its off-by-one edges (back-to-back bookings must NOT conflict). |
| Timezones done deliberately | `date-fns-tz` at the slot boundary; UTC `timestamptz` in Postgres | The golden rule demonstrated: store UTC, convert at the *edge*, keep "wall-clock" concepts (weekly availability) separate from instants. |
| Policy rules | cancellation with provider policy, reschedule flow | Business rules with time math: "cancel up to N hours before start" — computed against *whose* clock? |
| Roles via headers | `x-user-id` / `x-user-role: provider` | Customer vs. provider — first two-role API. Note that no server code reads the role header: provider routes look up the provider profile by `x-user-id`, so any user id with a profile acts as that provider. |
| Notifications as rows | `models/notificationModel.ts` | The outbox idea in embryo: record the intent to notify in the same DB (and transaction?) as the booking. Real email comes later; the *pattern* is the point. |
| Multi-model backend | 5 models, 3 services, 2 controllers | The biggest layered backend yet that's still readable in a sitting. |

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL + Zod + date-fns-tz.
API on **:4214**, client on **:5174**. DB: `appointment_booking`.

## 2. Run it (10 minutes)

```bash
createdb appointment_booking
cd 14-appointment-booking/server && cp ../.env.example .env
npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 14-appointment-booking/client && npm install && npm run dev   # optional: a client/.env with VITE_API_URL (see ../.env.example)
```

Demo identities: customer `x-user-id: 4`; provider `x-user-id: 1` + `x-user-role: provider`.

**Interrogate the slot engine first — it's the heart:**

```bash
# available slots for a provider/service/date (route: providerRoutes.ts, /providers/:id/available-slots)
curl "http://localhost:4214/api/providers/1/available-slots?serviceId=1&date=2026-07-06" -H "x-user-id: 4"

# book one, then re-request the slots — the booked one must vanish
curl -X POST "http://localhost:4214/api/appointments" -H "content-type: application/json" \
  -H "x-user-id: 4" -d '{"providerId":1,"serviceId":1,"startTime":"<an ISO startTime from the slot list>"}'
```

Then in the UI: book as the customer, flip to the provider dashboard, and find the
same appointment in "today's schedule."

## 3. Guided code tour (read in this order)

| # | File | Notice this |
|---|------|-------------|
| 1 | `server/db/migrations/` | The time columns. Which are `timestamptz` (instants: appointments) vs. time/weekday fields (wall-clock: weekly availability)? That split IS the timezone design. |
| 2 | `server/src/services/slotService.ts` | **Read three times.** Pass 1: shape (inputs → candidate slots → filters → output). Pass 2: the override logic — how a date-specific override beats the weekly rule. Pass 3: the conflict filter against existing appointments, and where timezone conversion happens (find every `date-fns-tz` call; there should be few, at the edges). |
| 3 | `server/src/services/appointmentService.ts` | Booking: does it re-validate the slot server-side, or trust the client's chosen time? (It re-checks *conflicts* under a provider lock, but not availability hours, past times or the advance window — compare with `slotService`.) Then the cancellation policy math and the reschedule path (cancel+rebook, or mutate?). |
| 4 | `server/src/middleware/requestContext.ts` + `types/express.d.ts` | How `x-user-id`/`x-user-role` become a typed `req` context — the same declaration-merging trick as Project 5. |
| 5 | `server/src/services/providerService.ts` | Availability CRUD and override management — what stops a provider deleting availability that has future booked appointments inside it? (Check. If nothing does, you found Lab 4.) |
| 6 | `models/notificationModel.ts` + its call sites | Which events write notifications, and whether they're inside the booking transaction. |
| 7 | `client/src/features/` | The booking flow UI: how the date picker triggers slot fetches, and how the client displays times (whose timezone?). |

## 4. Trace this flow

**"Why is 10:30 not offered?"** Pick a provider/date, get the slots, and account for
every gap in the output: weekly window boundaries, an override, an existing
appointment's duration, or service duration not fitting before closing time.
Reproduce the computation on paper from the raw tables. When your paper answer matches
the API, you own the algorithm.

## 5. The challenge ladder

### Level 1 — Junior
1. **Make the buffer real.** A provider-level `booking_buffer_minutes` already
   exists and the slot generator spaces slots by it, but the conflict queries ignore
   it. Add it to the overlap math (or move it per service) and write a test proving
   a direct API booking can no longer sit flush against another appointment.
2. **Surface the cancellation deadline in the UI:** "free cancellation until Tue
   14:00" computed by the server, rendered by the client. Server computes because
   policy is business logic (same argument as P13's shipping banner).

### Level 2 — Mid
3. **The double-booking race:** two customers book the same slot via `Promise.all`.
   Exactly one must win. If the current guard is a service-level check, add the real
   one: an exclusion constraint (`EXCLUDE USING gist` on provider + time range —
   learn `tstzrange` for this) or a guarded insert. This is the strongest version of
   the race you solved in Projects 10/13 — the DB-constraint answer is new.
4. **DST torture test:** find your local zone's DST transition date (or use
   `America/New_York`, Nov 1 2026). Generate slots for a provider whose availability
   spans 01:00–03:00 that day. Document what happens to the skipped/repeated hour and
   fix any slot that appears twice or 25 hours long.
5. **Reschedule atomically:** whatever the current reschedule does, make it one
   transaction that (a) frees the old slot, (b) claims the new one with full conflict
   checks, (c) writes a notification row — and never leaves zero-or-two appointments.

### Level 3 — Senior
6. **Availability-change safety (design + implement):** provider shrinks their weekly
   hours; three future appointments now fall outside availability. Options: block the
   change, allow + flag conflicts for manual resolution, auto-cancel with
   notifications. Write the one-page policy (who eats the cost?), then implement the
   flagging query — it's a nice interval anti-join.
7. **Notifications → outbox memo (1 page):** notifications are rows today. Design the
   step to real delivery: a worker polling the table, at-least-once semantics,
   idempotent sends, retry/backoff, and why writing the row *in the booking
   transaction* is exactly the "transactional outbox" pattern — name it, diagram it.
8. **Multi-timezone clients:** provider in Denver, customer in Berlin. Audit every
   place a time is displayed or entered. What does "09:00" mean in the availability
   editor (provider-local wall clock) vs. the booking UI (customer-local)? Write the
   rule the codebase follows — or should follow — in two sentences.

## 6. Questions you should be able to answer afterward

- Why must weekly availability be stored as wall-clock (weekday + time) while appointments are stored as UTC instants? What corrupts if you store availability as UTC?
- State the interval-overlap predicate and explain why `<=` vs `<` decides whether back-to-back bookings conflict.
- Why does the server re-validate the slot at booking time even though it generated the slot list seconds ago?
- What can a Postgres exclusion constraint guarantee that any service-level check cannot?
- Why are notification rows written to the same database as bookings instead of calling an email API inline? (Failure coupling — the booking must not fail because SMTP did.)

## 7. Common traps

- **`new Date('2026-07-06')` is UTC midnight,** not local midnight. Date-only strings + timezone conversion is where most slot bugs are born.
- **Comparing instants with wall-clock:** never compare an appointment `timestamptz` against "17:00" without converting one side. Grep yourself doing it.
- **Duration math across DST:** start + 60 minutes is not always the same wall-clock gap. Compute in UTC instants, display at the edge.
- **The provider role header is trust, not auth** — same caveat as Projects 11–13's demo headers. Inventory what real auth would change (it's the P5 port again).

Next: Project 15 (`15-api-tester`) — you build the tool you've been using: a
Postman-lite with a proxy, environments, and variable interpolation.
