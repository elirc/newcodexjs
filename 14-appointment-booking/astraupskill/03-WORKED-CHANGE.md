# Worked implementation and examples

[Course index](README.md)

## Before and after

**Before:** Two bookings could both pass the overlap query before either insert committed. A notification failure could leave a booking saved without its expected confirmation record.

**After:** Appointment creation and confirmed timing/status updates lock the provider before checking overlaps. Booking and its notification commit together. Conflicting reschedules leave the original appointment untouched.

## Predict this example

Two requests for 2099-01-01T10:00:00Z create one confirmed appointment and one 409 conflict. A 10:30 appointment succeeds. Moving it to 10:15 fails and leaves 10:30 stored. Reject notification inserts in the test schema and verify no booking is added.

Before running anything, write the exact expected stored values and visible response. Include ids or record counts where they matter. Then run the focused tests and reproduce the matching UI/API action. Do not settle for seeing a success message: inspect the authoritative stored result as well.

## Actual implementation excerpt

The lines below are the ones Astra changed (compare `AstraOrganized2/astrafinalplan/implementation/batch04/backups/65/server/src/models/appointmentModel.ts` with `diff --strip-trailing-cr -w`): `createAppointment` now locks the provider row, re-runs `ensureNoConflict` under that lock, and inserts the appointment and its notification in one transaction. The linked source is authoritative if you later edit the project.

```typescript
// models/appointmentModel.ts:81
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


// models/appointmentModel.ts:127
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
```

## Which rows hold a slot

`ensureNoConflict` in `server/src/models/appointmentModel.ts` only looks at appointments whose `status` is `confirmed`. Two consequences follow, and both are now pinned by the fourth test. First, a cancelled, completed or no-show row never blocks a booking, so a slot is free the moment a customer cancels (the status `CHECK` constraint in the migration allows only `confirmed`, `cancelled_by_customer`, `cancelled_by_provider`, `completed` and `no_show`; there is no `pending`). Second, new bookings hold their slot only because `bookAppointment` in `services/appointmentService.ts` (line 29) omits `status` when it calls `appointmentModel.createAppointment`, so the migration's column default `defaultTo("confirmed")` applies (line 125 of that service sets `status: "confirmed"` explicitly, but on the reschedule path); if a future `pending` default were added, or booking passed `pending` explicitly, two customers could book the same time and both succeed. The policy is a product decision (a provider who wants to approve bookings would add `pending` to the constraint and make it hold the slot). If you change it, change `ensureNoConflict`, the reschedule path in `updateAppointment` (which only re-checks when `next.status === "confirmed"`), and the test together.

## How to reason through the code

1. Identify the inputs. Distinguish data supplied by a caller from state read from storage or a trusted context.
2. Find the guard clauses. For each early return or thrown error, describe which invariant it protects and whether anything has already been written.
3. Find the candidate state or query. Explain whether it mutates an existing object or constructs a replacement.
4. Locate the persistence operation. For asynchronous code, follow the promise through success and rejection; for transactions, check that all related writes use the same transaction object.
5. Find the output or state publication. Ask what a repeated invocation would do after the first invocation succeeds.

Use this project-specific reasoning as your guide:

Represent an appointment as the half-open interval [start,end). A 10:00–10:30 appointment and a 10:30–11:00 appointment are adjacent, not overlapping. The overlap predicate is existing.start < proposed.end AND existing.end > proposed.start. Using <= at both boundaries would reject valid back-to-back bookings.

The preflight conflict query is useful feedback but cannot settle concurrency. The model takes the provider lock, rechecks overlap and writes inside one transaction. Creation and rescheduling use the same provider coordination rule, so they cannot independently approve overlapping confirmed appointments. The provider lock deliberately favors a simple explanation over maximum parallelism.

The booking notification is a database row, not an email sent by this task. Inserting it inside the booking transaction ensures the two records commit together. Availability windows, booking buffers, advance-booking policy and cancelled-record rescheduling remain separate business rules; the tested guarantee is overlap protection and atomic booking confirmation, not full scheduling policy enforcement.

## Three variations to work through

**Normal variation — back to back.** Book 10:00 and then 10:30 for the 30-minute service. Predict 201 and 201, two `confirmed` rows, two notifications. Then book 10:15: predict 409 and no new row.

**Invalid variation — a service from another provider.** Insert a second provider with its own service in `psql` and post `{ providerId: 1, serviceId: <other> }`. Predict 404 `Service not found` (the service exists but belongs to someone else) and no row. Then post a malformed `startTime`: predict a rejection from `validate({ body: bookingBodySchema })` before any query. Note that it currently surfaces as 500 `APP_ERROR` ("Unexpected server error"), not 400, because `middleware/validate.ts` throws a `ZodError` and `errorMiddleware.ts` only maps `AppError` subclasses; see the senior findings in `docs/architecture.md`.

**Boundary variation — the race.** Reproduce the first test: two identical bookings in a `Promise.all`. Predict `[201, 409]` and one row. Then remove the provider `forUpdate()` on a throwaway branch and repeat until you see `[201, 201]` and two overlapping confirmed rows; restore it and explain which query read stale data.

## Executable examples

These are the actual regression tests in [test/booking.test.ts](../test/booking.test.ts). Read each test as arrange → act → assert. Setup creates a controlled initial state, the action exercises the application code, and assertions compare observable behavior with an independently stated expectation.

```typescript
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { database, request } from "./database.js";
let h: Awaited<ReturnType<typeof database>>;
before(async () => {
  h = await database();
  await h.db("users").insert([
    { id: 1, name: "Provider", email: "p@example.com", role: "provider" },
    { id: 4, name: "Customer", email: "c@example.com", role: "customer" },
  ]);
  await h.db("provider_profiles").insert({ id: 1, user_id: 1 });
  await h.db("services").insert({
    id: 1,
    provider_id: 1,
    name: "Consultation",
    duration_minutes: 30,
    price: 10,
  });
});
after(async () => {
  if (h) await h.close();
});
const api = (path: string, method = "POST", body?: unknown) =>
  request(h.origin, "/api" + path, method, body, { "x-user-id": "4" });
const book = (startTime: string) =>
  api("/appointments", "POST", { providerId: 1, serviceId: 1, startTime });
test("concurrent bookings for one slot yield one appointment and one conflict", async () => {
  const results = await Promise.all([
    book("2099-01-01T10:00:00Z"),
    book("2099-01-01T10:00:00Z"),
  ]);
  assert.deepEqual(
    results.map((r) => r.status).sort(),
    [201, 409],
    JSON.stringify(results),
  );
  assert.equal(
    Number((await h.db("appointments").count("* as n").first()).n),
    1,
  );
  assert.equal(
    Number((await h.db("notifications").count("* as n").first()).n),
    1,
  );
});
test("adjacent appointment works; conflicting reschedule leaves its old time intact", async () => {
  const a = await book("2099-01-01T10:30:00Z");
  assert.equal(a.status, 201);
  const id = a.data.data.id;
  const r = await api(`/appointments/${id}/reschedule`, "PUT", {
    startTime: "2099-01-01T10:15:00Z",
  });
  assert.equal(r.status, 409);
  assert.equal(
    new Date(
      (await h.db("appointments").where({ id }).first()).start_time,
    ).toISOString(),
    "2099-01-01T10:30:00.000Z",
  );
});
test("notification insert failure rolls the booking back", async () => {
  await h.db.raw(
    `CREATE FUNCTION reject_notification() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$; CREATE TRIGGER reject_notification BEFORE INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION reject_notification();`,
  );
  const count = (await h.db("appointments").count("* as n").first()).n;
  try {
    assert.equal((await book("2099-01-02T10:00:00Z")).status, 500);
    assert.equal((await h.db("appointments").count("* as n").first()).n, count);
  } finally {
    // Leave the schema usable for the tests that follow.
    await h.db.raw("DROP TRIGGER reject_notification ON notifications; DROP FUNCTION reject_notification();");
  }
});

test("only confirmed rows hold a slot: a cancelled row does not block, a confirmed one does", async () => {
  // Policy pinned here: ensureNoConflict only considers status = 'confirmed'.
  // (The status CHECK constraint allows confirmed, cancelled_by_customer, cancelled_by_provider, completed, no_show.)
  await h.db("appointments").insert({
    provider_id: 1, customer_id: 4, service_id: 1, status: "cancelled_by_customer",
    start_time: new Date("2099-02-01T09:00:00Z"), end_time: new Date("2099-02-01T09:30:00Z"), price: 10,
  });
  const overCancelled = await book("2099-02-01T09:00:00Z");
  assert.equal(overCancelled.status, 201, JSON.stringify(overCancelled.data));
  const overConfirmed = await book("2099-02-01T09:15:00Z");
  assert.equal(overConfirmed.status, 409);
});
```

## Explain it back

Give a five-minute walkthrough: the original problem, one invariant, the exact changed function, the most revealing failure test, and one remaining limitation. You should be able to explain why the implementation is correct for the worked example without reading the code aloud line by line.
