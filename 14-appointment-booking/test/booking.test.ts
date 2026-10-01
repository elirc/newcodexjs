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
