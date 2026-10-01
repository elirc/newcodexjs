import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { database, request } from "./database.js";
let h: Awaited<ReturnType<typeof database>>;
before(async () => {
  h = await database();
  await h.db("workspaces").insert({ id: 1, name: "Learning team" });
});
after(async () => {
  if (h) await h.close();
});
const api = (path = "", method = "GET", body?: unknown) =>
  request(h.origin, "/api/tasks" + path, method, body);
async function create(title: string, status = "todo") {
  const r = await api("", "POST", { title, status, workspace_id: 1 });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  return r.data.data;
}
test("partial edit preserves omitted values; invalid edits leave stored values unchanged", async () => {
  const a = await create("Partial");
  let r = await api(`/${a.id}`, "PUT", { title: "Renamed" });
  assert.equal(r.status, 200);
  assert.equal(r.data.data.owner, a.owner);
  for (const bad of [
    { title: " " },
    { metadata: [] },
    { status: null },
    { priority: 3 },
    { due_at: "2025-02-30" },
    { workspace_id: "1" },
    {},
  ])
    assert.equal((await api(`/${a.id}`, "PUT", bad)).status, 400);
  assert.equal((await api(`/${a.id}`)).data.data.title, "Renamed");
  assert.equal((await api("/1e2")).status, 400);
});
test("archive and restore preserve the previous workflow state and repeats are no-ops", async () => {
  const a = await create("Lifecycle", "in_progress");
  assert.equal((await api(`/${a.id}/archive`, "PATCH", {})).status, 200);
  const count = async () =>
    Number((await h.db("audit_log").count("* as count").first()).count);
  const once = await count();
  assert.equal((await api(`/${a.id}/archive`, "PATCH", {})).status, 200);
  assert.equal(await count(), once);
  const r = await api(`/${a.id}/restore`, "PATCH", {});
  assert.equal(r.status, 200);
  assert.equal(r.data.data.status, "in_progress");
  assert.equal(r.data.data.archived_at, null);
  const restored = await count();
  await api(`/${a.id}/restore`, "PATCH", {});
  assert.equal(await count(), restored);
});
test("bulk status rejects missing IDs atomically and records real before/after values", async () => {
  const a = await create("Bulk");
  assert.equal(
    (
      await api("/bulk/status", "POST", {
        ids: [a.id, 999999],
        status: "in_progress",
      })
    ).status,
    404,
  );
  assert.equal((await api(`/${a.id}`)).data.data.status, "todo");
  const r = await api("/bulk/status", "POST", {
    ids: [a.id, a.id],
    status: "in_progress",
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.data.length, 1);
  const audit = await h
    .db("audit_log")
    .where({ action: "bulk_status" })
    .orderBy("id", "desc")
    .first();
  assert.equal(audit.before.status, "todo");
  assert.equal(audit.after.status, "in_progress");
  const count = await h.db("audit_log").count("* as count").first();
  await api("/bulk/status", "POST", { ids: [a.id], status: "in_progress" });
  assert.deepEqual(await h.db("audit_log").count("* as count").first(), count);
});
test("ordinary status edits keep archive flags consistent; deleted records cannot be restored", async () => {
  const a = await create("Flags");
  await api(`/${a.id}`, "PUT", { status: "archived" });
  assert.ok((await api(`/${a.id}`)).data.data.archived_at);
  await api(`/${a.id}`, "PUT", { status: "in_progress" });
  assert.equal((await api(`/${a.id}`)).data.data.archived_at, null);
  assert.equal((await api(`/${a.id}`, "DELETE")).status, 200);
  assert.equal((await api(`/${a.id}/restore`, "PATCH", {})).status, 404);
});

test("the bulk cap counts distinct ids, and restore reads status_before_archive", async () => {
  const a = await create("Cap", "blocked");
  const repeated = Array.from({ length: 150 }, () => a.id);
  assert.equal((await api("/bulk/status", "POST", { ids: repeated, status: "done" })).status, 200);
  assert.equal((await api(`/${a.id}`)).data.data.status, "done");
  assert.equal((await api(`/${a.id}/archive`, "PATCH", {})).status, 200);
  const restored = await api(`/${a.id}/restore`, "PATCH", {});
  assert.equal(restored.data.data.status, "done");
  assert.equal(restored.data.data.status_before_archive, null);
});
