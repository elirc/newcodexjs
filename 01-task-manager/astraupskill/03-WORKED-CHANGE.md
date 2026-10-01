# Worked implementation and examples

[Course index](README.md)

## Before and after

**Before:** The project already had CRUD routes and validation. It lacked executable regression coverage for the complete path, allowed unsafe integer ids and overlong titles to reach deeper layers, and could reject editing an overdue task when its unchanged date was resubmitted.

**After:** The API rejects unsafe ids and titles longer than the database column. An unchanged existing due date remains editable; new or changed due dates still follow the future-date rule. Tests call real HTTP routes and inspect PostgreSQL rows, including completion timestamps and deletion.

## Predict this example

Create a high-priority task due 2099-01-01, filter for high priority, mark it done, reopen it and delete it. Separately seed a task due 2020-01-01: editing its title with that same due date succeeds, but changing it to another past date fails.

Before running anything, write the exact expected stored values and visible response. Include ids or record counts where they matter. Then run the focused tests and reproduce the matching UI/API action. Do not settle for seeing a success message: inspect the authoritative stored result as well.

## Actual implementation excerpt

The excerpt below comes from [server/src/services/taskService.js](../server/src/services/taskService.js) near line 243. It is a teaching snapshot; the linked source is authoritative if you later edit the project. Read surrounding code for callers and setup.

```javascript
function buildUpdatePayload(payload, existingTask) {
  const updates = {};

  if (hasOwn(payload, 'title')) {
    updates.title = normalizeTitle(payload.title);
  }

  if (hasOwn(payload, 'description')) {
    updates.description = normalizeDescription(payload.description);
  }

  if (hasOwn(payload, 'priority')) {
    updates.priority = normalizePriority(payload.priority);
  }

  if (hasOwn(payload, 'status')) {
    updates.status = normalizeStatus(payload.status);

    if (updates.status === 'done') {
      updates.completed_at = existingTask.completed_at || new Date();
    } else {
      updates.completed_at = null;
    }
  }

  if (hasOwn(payload, 'due_date')) {
    // An overdue task must remain editable when its existing date is submitted.
    const existingDate = existingTask.due_date ? toDateOnly(new Date(existingTask.due_date)) : null;
    updates.due_date = payload.due_date === existingDate ? existingDate : normalizeDueDate(payload.due_date);
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('At least one task field must be provided.');
  }

  return updates;
}

/**
 * Lists tasks after validating filter and sort query parameters.
 *
 * @param {object} query - Express query object.
 * @returns {Promise<object[]>} Tasks matching the requested filters.
 */
```

## How to reason through the code

1. Identify the inputs. Distinguish data supplied by a caller from state read from storage or a trusted context.
2. Find the guard clauses. For each early return or thrown error, describe which invariant it protects and whether anything has already been written.
3. Find the candidate state or query. Explain whether it mutates an existing object or constructs a replacement.
4. Locate the persistence operation. For asynchronous code, follow the promise through success and rejection; for transactions, check that all related writes use the same transaction object.
5. Find the output or state publication. Ask what a repeated invocation would do after the first invocation succeeds.

Use this project-specific reasoning as your guide:

Each layer has a specific responsibility. A route chooses which operation handles a URL; a controller adapts HTTP input/output; a service enforces rules; a model issues SQL. Following one request is easier than reading every file alphabetically. The database is still the final authority for constraints, but expected bad input should produce a useful client error before a database exception. Number.isSafeInteger rejects values JavaScript cannot represent precisely; Number.isInteger alone is insufficient. Updates require context: the rule for setting a new due date should not prevent maintaining an already-overdue task. The unchanged-date exception is therefore narrow and compares against the stored date. The date column is a calendar date, so normalize it to YYYY-MM-DD instead of comparing display-formatted strings. Real HTTP-plus-database tests prove more than a mocked service test, but they still do not prove that every browser interaction is correct.

## Three variations to work through

**Normal variation — a bounded title.** `PUT /api/tasks/:id` with `{ "title": "x".repeat(255) }`: predict 200. Then `{ "title": "x".repeat(256) }`: predict 400 with the message from `normalizeTitle`, and the row unchanged (`SELECT title FROM tasks WHERE id = ...`).

**Invalid variation — an impossible date.** `PUT` with `{ "due_date": "2099-02-30" }`. Predict 400 from `normalizeDueDate` and no write. Then submit the task's *existing* overdue date unchanged with a new title: predict 200, because the rule only rejects a *new* past date (third test).

**Boundary variation — nothing to update.** `PUT` with `{}`. Predict 400 `At least one task field must be provided.` from `buildUpdatePayload` (line 281) and no `UPDATE` statement at all; the new fourth test pins it. Explain why this is a 400 and not a 200 no-op.

## Executable examples

These are the actual regression tests in [server/test/tasks.test.cjs](../server/test/tasks.test.cjs). Read each test as arrange → act → assert. Setup creates a controlled initial state, the action exercises the application code, and assertions compare observable behavior with an independently stated expectation.

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

## Explain it back

Give a five-minute walkthrough: the original problem, one invariant, the exact changed function, the most revealing failure test, and one remaining limitation. You should be able to explain why the implementation is correct for the worked example without reading the code aloud line by line.
