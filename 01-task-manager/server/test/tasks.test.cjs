const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const harness = require("./database.cjs");
harness.configure();
const { db } = require("../src/config/database");
const app = require("../src/app");
let clean, api;
before(async () => {
  clean = await harness.prepare(
    db,
    require("../db/migrations/20260703000000_create_tasks_table").up,
  );
  api = await harness.listen(app);
});
after(async () => {
  if (api) await api.close();
  if (clean) await clean();
});
test("HTTP create/read/filter/edit/delete round trip persists actual SQL rows", async () => {
  const created = await api.request("POST", "/api/tasks", {
    title: "Learn the request path",
    priority: "high",
    due_date: "2099-01-01",
  });
  assert.equal(created.status, 201);
  const id = created.body.data.id;
  assert.equal(
    (await db("tasks").where({ id }).first()).title,
    "Learn the request path",
  );
  const list = await api.request("GET", "/api/tasks?priority=high");
  assert.ok(list.body.data.some((task) => task.id === id));
  const done = await api.request("PUT", `/api/tasks/${id}`, { status: "done" });
  assert.equal(done.status, 200);
  assert.ok(done.body.data.completed_at);
  const reopened = await api.request("PUT", `/api/tasks/${id}`, {
    status: "todo",
  });
  assert.equal(reopened.body.data.completed_at, null);
  assert.equal((await api.request("DELETE", `/api/tasks/${id}`)).status, 200);
  assert.equal((await api.request("GET", `/api/tasks/${id}`)).status, 404);
});
test("invalid inputs are client errors and never create rows", async () => {
  const before = Number((await db("tasks").count("* as count").first()).count);
  for (const body of [
    { title: " " },
    { title: "x".repeat(256) },
    { title: "x", due_date: "2099-02-30" },
    { title: "x", priority: "urgent" },
    { title: "x", description: "x".repeat(5001) },
  ])
    assert.equal((await api.request("POST", "/api/tasks", body)).status, 400);
  assert.equal(
    (await api.request("GET", "/api/tasks/9007199254740992")).status,
    400,
  );
  assert.equal(
    Number((await db("tasks").count("* as count").first()).count),
    before,
  );
});
test("an overdue task can be edited when the existing date is submitted unchanged", async () => {
  const [row] = await db("tasks")
    .insert({
      title: "Overdue",
      due_date: "2020-01-01",
      priority: "low",
      status: "todo",
    })
    .returning("*");
  const result = await api.request("PUT", `/api/tasks/${row.id}`, {
    title: "Still relevant",
    due_date: "2020-01-01",
  });
  assert.equal(result.status, 200);
  assert.equal(
    (await db("tasks").where({ id: row.id }).first()).title,
    "Still relevant",
  );
  assert.equal(
    (
      await api.request("PUT", `/api/tasks/${row.id}`, {
        due_date: "2020-01-02",
      })
    ).status,
    400,
  );
});

test("an update with no editable fields is a 400 and changes nothing", async () => {
  const created = await api.request("POST", "/api/tasks", { title: "Untouched", priority: "low" });
  assert.equal(created.status, 201);
  const id = created.body.data.id;
  const before = await db("tasks").where({ id }).first();
  const empty = await api.request("PUT", `/api/tasks/${id}`, {});
  assert.equal(empty.status, 400);
  assert.match(empty.body.error?.message ?? JSON.stringify(empty.body), /At least one task field/);
  assert.deepEqual(await db("tasks").where({ id }).first(), before);
});
