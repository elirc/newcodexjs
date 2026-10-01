import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { database, request } from "./database.js";
let h: Awaited<ReturnType<typeof database>>,
  a: number,
  b: number,
  other: number;
before(async () => {
  h = await database();
  await h
    .db("users")
    .insert(
      [1, 2].map((id) => ({
        id,
        name: "Learner",
        email: `u${id}@example.com`,
      })),
    );
  a = (
    await h
      .db("environments")
      .insert({ user_id: 1, name: "Local", is_active: true })
      .returning("id")
  )[0].id;
  b = (
    await h
      .db("environments")
      .insert({ user_id: 1, name: "Staging" })
      .returning("id")
  )[0].id;
  other = (
    await h
      .db("environments")
      .insert({ user_id: 2, name: "Other", is_active: true })
      .returning("id")
  )[0].id;
});
after(async () => {
  if (h) await h.close();
});
const api = (path: string, method = "GET", body?: unknown) =>
  request(h.origin, "/api" + path, method, body, { "x-user-id": "1" });
test("failed activation preserves the previous active environment", async () => {
  for (const id of [other, 999999])
    assert.equal(
      (await api(`/environments/${id}/activate`, "POST", {})).status,
      404,
    );
  assert.equal(
    (await h.db("environments").where({ id: a }).first()).is_active,
    true,
  );
});
test("concurrent activation and metadata edits retain one active environment per user", async () => {
  const results = await Promise.all([
    api(`/environments/${a}/activate`, "POST", {}),
    api(`/environments/${b}/activate`, "POST", {}),
  ]);
  assert.deepEqual(
    results.map((r) => r.status),
    [200, 200],
  );
  assert.equal(
    (await h.db("environments").where({ user_id: 1, is_active: true })).length,
    1,
  );
  assert.equal(
    (await api(`/environments/${a}`, "PUT", { is_active: true })).status,
    200,
  );
  assert.equal(
    (await h.db("environments").where({ user_id: 1, is_active: true })).length,
    1,
  );
  assert.equal(
    (await h.db("environments").where({ id: other }).first()).is_active,
    true,
  );
});
test("variable replacement accepts arrays, rejects duplicate keys atomically, and supports clearing", async () => {
  const path = `/environments/${a}/variables`;
  assert.equal(
    (
      await api(path, "PUT", [
        { key: "BASE_URL", value: "http://localhost:3000" },
      ])
    ).status,
    200,
  );
  assert.equal(
    (
      await api(path, "PUT", [
        { key: "KEY", value: "one" },
        { key: " KEY ", value: "two" },
      ])
    ).status,
    400,
  );
  const saved = await h.db("env_variables").where({ environment_id: a });
  assert.equal(saved.length, 1);
  assert.equal(saved[0].key, "BASE_URL");
  assert.equal(
    (await api(`/environments/${other}/variables`, "PUT", [])).status,
    404,
  );
  assert.equal((await api(path, "PUT", [])).status, 200);
  assert.equal(
    (await h.db("env_variables").where({ environment_id: a })).length,
    0,
  );
});

test("saved request header/parameter arrays survive create, partial edit and duplication", async () => {
  const r = await api("/requests", "POST", {
    name: "Local fixture",
    method: "GET",
    url: "http://localhost:3000/health",
    headers: [{ key: "Accept", value: "application/json" }],
    params: [{ key: "limit", value: "2" }],
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const id = r.data.data.id;
  assert.deepEqual(r.data.data.headers, [
    { key: "Accept", value: "application/json" },
  ]);
  const edit = await api(`/requests/${id}`, "PUT", { name: "Renamed" });
  assert.equal(edit.status, 200);
  assert.deepEqual(edit.data.data.params, [{ key: "limit", value: "2" }]);
  const copy = await api(`/requests/${id}/duplicate`, "POST", {});
  assert.equal(copy.status, 201);
  assert.deepEqual(copy.data.data.headers, r.data.data.headers);
});
