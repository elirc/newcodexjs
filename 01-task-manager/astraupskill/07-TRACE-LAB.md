# Trace lab: one task through its HTTP lifecycle

[Course index](README.md)

## Run it before you trace it

The first executable example from chapter 03, so the trace starts from a request you have actually sent:

```javascript
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
```

Watch the server log while it runs, then follow the boundaries below with that exact request in mind.

## Trace the real call path

### Boundary 1 — the form decides what to send

`client/src/features/tasks` and `client/src/pages`: the task form posts the whole form on create and the edited fields on save; `client/src/services/tasksApi.js` maps those to `POST /api/tasks` and `PUT /api/tasks/:id`. Nothing is validated in the browser beyond input types.

### Boundary 2 — the request leaves the browser

`client/src/services/apiClient.js` wraps `fetch`, sets the JSON header and turns a non-2xx into an error carrying the server's `error.message`; that string is what the form shows.

### Boundary 3 — the route and service validate

`server/src/routes/taskRoutes.js` maps `PUT /:id` to `taskController.updateTask` via `asyncHandler`; the controller calls `taskService`, where `parseTaskId` (line 38), `normalizeTitle` (108), `normalizeDescription` (131, with the 5000-character bound), `normalizeDueDate` (162) and `buildUpdatePayload` (249, the "at least one field" guard at 281 and the unchanged-overdue-date rule) reject bad input with `ValidationError` before any query.

### Boundary 4 — the model builds one statement

`server/src/models/taskModel.js` `updateTask(id, updates)` (line 71) is one Knex `UPDATE ... WHERE id = ? RETURNING *`; `createTask` (58) one `INSERT ... RETURNING *`. There is no read-modify-write in the model; the service already loaded the existing task to decide what changed.

### Boundary 5 — PostgreSQL commits or rejects

The `tasks` table (`server/db/migrations/20260703000000_create_tasks_table.js`) has `date` and `text` columns; the length bounds are product rules enforced in the service, because `text` accepts anything. In tests the statement runs in a private schema created by `server/test/database.cjs`.

### Boundary 6 — the envelope tells the client what happened

`server/src/utils` `sendSuccess` answers `{ success: true, data }`; the error middleware maps `ValidationError` to 400 `{ success: false, error: { message } }`. The tests assert the status and then read the row with `db("tasks")` to prove what was stored.

## Follow the layers

A route selects a controller, the service enforces rules and the model performs SQL. Responses return through those layers. Use chapter 3's actual CRUD test to find the endpoint, payload and response envelope rather than assuming a generic API shape.

Create a task, capture its returned id, read it, edit that id, delete it and read again. Expect the same identity through editing and absence after deletion. A successful status code without a read-back would not prove persistence.

## Match validation to storage

JavaScript can represent integers larger than a PostgreSQL integer column accepts. IDs must be positive whole numbers no greater than 2,147,483,647. Reject -1, 1.5 and 2147483648 before SQL. Titles are bounded to 255 characters to match the schema.

Service validation provides helpful feedback. Database constraints remain a final safeguard; neither layer makes the other redundant.

## Understand an unchanged overdue date

A task was created with a future date that is now yesterday. Today the user changes only its title. Resubmitting that unchanged stored due date should not block the title edit.

Distinguish creating a past-dated task, changing a date to a new past value, and resubmitting an existing unchanged overdue date. The first two remain rejected; the third is accepted. Validation therefore needs stored state as well as request data.

## Explain test ownership

The helper creates a unique schema in a dedicated astra_test_* database, migrates it and starts the HTTP app on an available local port. Cleanup drops only that test schema. A schema is a namespace inside a database; all migration and request queries must use the same configured namespace.

Point to an assertion that would catch returning success without writing, then one that would catch creating a duplicate instead of updating. These demonstrate why a connected lifecycle test teaches more than four disconnected successful requests.
