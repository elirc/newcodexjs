# Worked implementation and examples

[Course index](README.md)

## Before and after

**Before:** Restore always assigned active, even when that was not a valid workflow state. Bulk updates could silently ignore missing IDs and audit entries lacked the actual previous record.

**After:** Archive stores the previous status in an additive migration, restore returns to that status, and repeats are no-ops. Ordinary and bulk status changes keep archive flags consistent. Bulk IDs are deduplicated; all targets are locked and checked before any change. Audit rows contain real before/after records. List refreshes ignore stale responses and use the current filters after a mutation; failed saves retain the draft and show an error.

## Predict this example

Create a record in muted, archive it twice and restore it twice. Only the actual transitions add history, and restore returns muted. Bulk-update [existingId,999999]: return 404 and leave the existing row unchanged. A duplicated valid ID changes once and audit.before/status differs from audit.after/status.

Before running anything, write the exact expected stored values and visible response. Include ids or record counts where they matter. Then run the focused tests and reproduce the matching UI/API action. Do not settle for seeing a success message: inspect the authoritative stored result as well.

## Actual implementation excerpt

The excerpt below comes from [server/src/models/model.ts](../server/src/models/model.ts) near line 173. It is a teaching snapshot; the linked source is authoritative if you later edit the project. Read surrounding code for callers and setup.

```typescript
async function lifecycleUpdate(
  id: number,
  updates: Record<string, unknown>,
  context: { actor: string; requestId: string },
  action: string,
) {
  return db.transaction(async (trx) => {
    const before = await baseQuery(trx).where({ id }).forUpdate().first();
    if (!before) throw new NotFoundError("Record not found.");
    if (action === "archived" && before.archived_at) return before;
    if (action === "restored" && !before.archived_at) return before;
    if (action === "restored")
      updates = {
        archived_at: null,
        status_before_archive: null,
        status: before.status_before_archive || "active",
      };
    else if (action === "archived")
      updates = { ...updates, ...statusFields(before, "archived") };
    const [record] = await trx(table)
      .where({ id })
      .whereNull("deleted_at")
      .update({
        ...updates,
        version: trx.raw("version + 1"),
        updated_at: trx.fn.now(),
      })
      .returning("*");
    await writeActivity(trx, id, action, `${action} ${before.title}`, {
      status: record.status,
      archived_at: record.archived_at,
      deleted_at: record.deleted_at,
    });
    await writeAudit(trx, id, context, action, before, record);
    return record;
  });
}

```

## How to reason through the code

1. Identify the inputs. Distinguish data supplied by a caller from state read from storage or a trusted context.
2. Find the guard clauses. For each early return or thrown error, describe which invariant it protects and whether anything has already been written.
3. Find the candidate state or query. Explain whether it mutates an existing object or constructs a replacement.
4. Locate the persistence operation. For asynchronous code, follow the promise through success and rejection; for transactions, check that all related writes use the same transaction object.
5. Find the output or state publication. Ask what a repeated invocation would do after the first invocation succeeds.

Use this project-specific reasoning as your guide:

Archive is a lifecycle operation with two related facts: a status and an archived timestamp. Setting one without the other makes filters disagree with the badge. The statusFields helper synchronizes those fields whether the request came from an archive button, a form or a bulk command. Restoring should return a conversations record to its previous workflow state. A legacy archived row without the new saved field falls back to active; the migration does not invent a historical state it cannot know.

Bulk editing should have explicit missing-target semantics. This implementation rejects the whole batch when any requested record is missing or soft-deleted. It deduplicates IDs before comparing lengths, locks targets in ID order and skips rows already at the desired status. Every changed record receives an audit entry with the actual previous and resulting values. A misleading before:null would make it harder to explain what changed.

The server validates partial fields before writing and keeps IDs stable. The version increments on change, but this is not yet optimistic concurrency: a client does not send an expected version. A row lock serializes writes; it does not detect a stale full-form edit. The role header is a demo mechanism, and workspace_id is a grouping foreign key rather than an enforced tenant boundary. This project is a conversation administration CRUD scaffold; its name does not establish live message delivery.

## Three variations to work through

- **Normal variation:** change one ordinary value in the successful fixture while preserving its shape. Predict which fields should change and which should remain identical. Execute it and explain any difference.

- **Invalid variation:** use the invalid case from the tests. Predict the error and the exact number of writes that should happen. Compare the state before and after; error text alone does not prove data integrity.

- **Boundary variation:** repeat the action, reload, delay a callback or force a late write failure as appropriate to this lesson. Explain why the boundary differs from the happy path. The test file below contains a concrete example you can adapt rather than inventing an unrealistic failure.

## Executable examples

These are the actual regression tests in [test/crud.test.ts](../test/crud.test.ts). Read each test as arrange → act → assert. Setup creates a controlled initial state, the action exercises the application code, and assertions compare observable behavior with an independently stated expectation.

```typescript
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
  request(h.origin, "/api/conversations" + path, method, body);
async function create(title: string, status = "active") {
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
  const a = await create("Lifecycle", "muted");
  assert.equal((await api(`/${a.id}/archive`, "PATCH", {})).status, 200);
  const count = async () =>
    Number((await h.db("audit_log").count("* as count").first()).count);
  const once = await count();
  assert.equal((await api(`/${a.id}/archive`, "PATCH", {})).status, 200);
  assert.equal(await count(), once);
  const r = await api(`/${a.id}/restore`, "PATCH", {});
  assert.equal(r.status, 200);
  assert.equal(r.data.data.status, "muted");
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
        status: "muted",
      })
    ).status,
    404,
  );
  assert.equal((await api(`/${a.id}`)).data.data.status, "active");
  const r = await api("/bulk/status", "POST", {
    ids: [a.id, a.id],
    status: "muted",
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.data.length, 1);
  const audit = await h
    .db("audit_log")
    .where({ action: "bulk_status" })
    .orderBy("id", "desc")
    .first();
  assert.equal(audit.before.status, "active");
  assert.equal(audit.after.status, "muted");
  const count = await h.db("audit_log").count("* as count").first();
  await api("/bulk/status", "POST", { ids: [a.id], status: "muted" });
  assert.deepEqual(await h.db("audit_log").count("* as count").first(), count);
});
test("ordinary status edits keep archive flags consistent; deleted records cannot be restored", async () => {
  const a = await create("Flags");
  await api(`/${a.id}`, "PUT", { status: "archived" });
  assert.ok((await api(`/${a.id}`)).data.data.archived_at);
  await api(`/${a.id}`, "PUT", { status: "muted" });
  assert.equal((await api(`/${a.id}`)).data.data.archived_at, null);
  assert.equal((await api(`/${a.id}`, "DELETE")).status, 200);
  assert.equal((await api(`/${a.id}/restore`, "PATCH", {})).status, 404);
});
```

## Explain it back

Give a five-minute walkthrough: the original problem, one invariant, the exact changed function, the most revealing failure test, and one remaining limitation. You should be able to explain why the implementation is correct for the worked example without reading the code aloud line by line.
