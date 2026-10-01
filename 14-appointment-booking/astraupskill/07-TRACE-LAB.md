# Trace lab: Appointment Booking: concurrent slot protection

[Course index](README.md) · [Worked change](03-WORKED-CHANGE.md) · [Tests](04-TESTING-AND-DEBUGGING.md)

## Run it before you trace it

The first executable example from chapter 03, so the trace starts from a request you have actually sent:

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

Watch the server log while it runs, then follow the boundaries below with that exact request in mind.

## The concrete case

This lab connects one visible action to the code that accepts or rejects it. Use a disposable dataset and write your prediction before running the operation. The goal is to explain what each boundary contributes, not to memorize a sequence of clicks.

Two requests for 2099-01-01T10:00:00Z create one confirmed appointment and one 409 conflict. A 10:30 appointment succeeds. Moving it to 10:15 fails and leaves 10:30 stored. Reject notification inserts in the test schema and verify no booking is added.

## Write the record before touching the form

Provider profiles belong to users and own services. Appointments reference provider, customer and service, with start_time/end_time/status/price. Availability rules supply candidate slots; notification rows describe booking events.

Make a small table in your own notes with these columns: field, starting value, proposed value, and source of truth. Include identity even when the form does not display it. Include related rows or stored counters when the operation changes more than one fact. Mark a value as derived if the app recomputes it rather than storing it independently.

For example, an edit can change a title while preserving an ID. A status command can keep the same status while producing no new history. An import can contain many rows yet be rejected before any replacement begins. In each case, the meaningful observation is the promised resulting state. A success toast alone cannot establish which fields changed.

## Trace the real call path

### Boundary 1 — the booking form decides what to send

`client/src/features/booking/*`: the slot picker shows times computed by `slotService.ts` on the server, and the form posts `{ providerId, serviceId, startTime, notes }` through `bookAppointment` (`client/src/services/api.ts:33`). The client never sends an end time: duration comes from the service on the server, so a tampered client cannot book a longer slot.

### Boundary 2 — the request leaves the browser

`client/src/services/api.ts`: the axios instance adds the demo `x-user-id`; `bookAppointment` posts to `/appointments`, reschedule puts to `/appointments/:id/reschedule`. `unwrap()` reads the envelope; a 409 surfaces as `That time slot is no longer available`, which the UI shows next to the picker so the customer can choose again.

### Boundary 3 — the route validates the shape

`server/src/routes/appointmentRoutes.ts` mounts `validateBody(...)` from `appointmentValidators.ts` (integer ids, ISO `startTime`, optional notes) in front of the controller; `middleware/validate.ts` replaces `req.body` with the parsed data. Business rules are not here: whether the provider accepts bookings, whether the service belongs to the provider, and whether the slot is free are decided lower down.

### Boundary 4 — the service resolves the entities and computes the interval

`createAppointment` in `services/appointmentService.ts` (line 40 onwards): load the provider (404 if not accepting), load the service and check `service.provider_id === input.providerId` and `is_active`, compute `endTime = start + duration_minutes`, run a first `findConflictingAppointments` for an early 409, then call the model with `status: "confirmed"` (line 125). The early check is advisory: the decisive one happens under the lock in the model.

### Boundary 5 — the model locks the provider and decides under the lock

`appointmentModel.createAppointment` (line 81): `db.transaction` -> `provider_profiles ... forUpdate()` -> `ensureNoConflict(trx, values)` (the half-open overlap query against `status = 'confirmed'`) -> insert `appointments` -> insert `notifications`. Two concurrent bookings serialize on the provider row; the second re-runs the overlap query after the first committed and throws `ConflictError`. The third test rejects the notification insert with a trigger and shows the appointment row was rolled back with it.

### Boundary 6 — the envelope tells the client what happened

`utils/errors.ts` `ConflictError` carries 409; `errorMiddleware.ts` maps it to `{ success: false, error: { message, code: "CONFLICT" } }`; success is 201 with the row. The first test asserts `[201, 409]` from two racing bookings, then counts one appointment and one notification directly in the database.

## Predict the regression scenarios

| Scenario from the executable suite | Prediction to write before running |
|---|---|
| concurrent bookings for one slot yield one appointment and one conflict | Initial records, request/input, expected result, and records that must remain unchanged. |
| adjacent appointment works; conflicting reschedule leaves its old time intact | Initial records, request/input, expected result, and records that must remain unchanged. |
| notification insert failure rolls the booking back | Initial records, request/input, expected result, and records that must remain unchanged. |

Open the test file and identify the arrange, act and assert portions. Arrange creates the synthetic starting state. Act calls the real boundary. Assert reads the observable result. Some tests repeat a call or issue two calls together; explain why a single ordinary call would miss that defect. Tests may share a deliberate fixture within one suite, so read setup and earlier scenario state before copying one case into a standalone script.

## A successful request, described precisely

Start with a valid fixture from the test. Copy the values into your own learning notes rather than copying a personal record. State which fields are required, which may be omitted and which have a special meaning when empty. Execute the operation once. Compare the response with a fresh authoritative read, then compare the UI with that read. If the UI is still loading, wait for the actual expected condition instead of guessing a fixed delay.

Record the stable ID and one changed field. Record at least one field that must remain the same. If the operation creates a child, record the parent ID stored on the child. If it updates an aggregate, compute the expected aggregate by hand. If it restores a backup, count retained, ignored and recreated records according to this project’s documented policy. These observations make a small example reusable when the implementation changes.

## A rejected request, described precisely

Now change one value to a rejected case named in the test suite. Keep everything else identical. Predict where validation fails. Run it and capture both the feedback and the authoritative state afterward. Compare the saved record, related rows and relevant counters with their pre-request values. A controlled error is useful only if the application also preserves the intended state.

Do not assume that all failures have the same status or message. Invalid input, missing records, conflicts and infrastructure errors represent different conditions. Read this app’s handler or parser to see the actual result. Browser-only parsers return a success/error union or throw an import error rather than returning an HTTP status. Translate the same correctness idea into the contract this app actually exposes.

## Read the storage boundary

The [test/database.ts](../test/database.ts) helper demonstrates migration-based isolation. It sets DATABASE_URL before importing the Knex connection and uses a unique PostgreSQL schema. The root workspace also makes pg and tsx available to the root test directory. A source import ending in .js is intentional: TypeScript resolves its .ts source during development and emitted Node code resolves .js after compilation.

Place a breakpoint immediately before the first write and another after the final write or publish step. On the success path, note what changed between those points. On the rejected-input path, the first write should never be reached when validation promises pre-write rejection. On a transactional failure path, some statements may execute and then roll back; reaching a write statement does not mean its effect committed.

An await marks a place where another operation can run. It does not itself define a transaction. When the test uses Promise.all, sketch request A and request B in two columns. Show where each acquires a lock or reads state. The test should accept either winner while insisting on the same final invariant. For synchronous or browser-only validation, explain why concurrency is outside the tested function rather than borrowing a database explanation that does not apply.

## Explain the design tradeoff

Represent an appointment as the half-open interval [start,end). A 10:00–10:30 appointment and a 10:30–11:00 appointment are adjacent, not overlapping. The overlap predicate is existing.start < proposed.end AND existing.end > proposed.start. Using <= at both boundaries would reject valid back-to-back bookings.

The preflight conflict query is useful feedback but cannot settle concurrency. The model takes the provider lock, rechecks overlap and writes inside one transaction. Creation and rescheduling use the same provider coordination rule, so they cannot independently approve overlapping confirmed appointments. The provider lock deliberately favors a simple explanation over maximum parallelism.

The booking notification is a database row, not an email sent by this task. Inserting it inside the booking transaction ensures the two records commit together. Availability windows, booking buffers, advance-booking policy and cancelled-record rescheduling remain separate business rules; the tested guarantee is overlap protection and atomic booking confirmation, not full scheduling policy enforcement.

## Change one requirement independently

**Practice task:** Explain the overlap predicate with four drawn intervals.

Before implementation, write three acceptance criteria: an ordinary successful case, a rejected or cancelled case, and a case that preserves existing behavior. Identify the smallest file boundary that owns the rule. Keep the existing regression suite; add a test only when it observes a new promise. Do not reproduce the implementation line by line inside the assertion, because both copies can contain the same mistake.

After a first attempt, compare your design with this hint: Cover disjoint, adjacent, partially overlapping and fully contained intervals; evaluate both inequalities for each.

## Debug a disagreement between layers

If the form and response disagree, inspect the request payload before editing the database code. If the response and database disagree, inspect the mapper, transaction and read query. If a test fails before an HTTP request is logged, inspect startup, environment variables and the test fixture. Missing dependencies, a busy port or an unavailable database are different from a failed business assertion. Preserve the first useful error and fix that cause before interpreting later cascading failures.

When a date looks wrong, distinguish a calendar label from an instant and check the serialization boundary. When an optional field will not clear, distinguish omission from an explicit empty/null value. When a list seems to lose a record, inspect filtering, sorting and pagination before assuming deletion. When history duplicates, compare desired-state commands with commands that represent a new event. These are diagnostic questions to apply to the actual fields above.

## Final independent checkpoint

Close this guide and give a five-minute walkthrough using only the application source and one test. Explain the user-visible problem, the input contract, the identity model, the write boundary, a failed operation and the remaining limitation. Then modify the worked fixture and predict the result without running it. Reopen the guide only after writing your answer.

A useful review note includes the exact command run, its result, and the boundary it covers. Keep browser interaction, simulated storage tests, real HTTP/database tests and compile checks distinct. The [verification page](VERIFICATION.md) records this delivery’s evidence. Exercises and proposed extensions in this course remain learner work; they are not counted as implemented features.
