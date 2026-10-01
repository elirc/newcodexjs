# Solutions and engineering review

[Course index](README.md) · [Practice prompts](05-PRACTICE.md)

Attempt each exercise before using these notes. These are solution approaches and review criteria, not claims that every extension has been implemented. The actual completed behavior is described in the worked-change chapter.

## Check a solution the same way the course checks its own

Every solution below should survive the same request chapter 03 runs; send it after your change and compare the response to the expected observations in chapter 03:

```typescript
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { database, request } from "./database.js";
let h: Awaited<ReturnType<typeof database>>;
before(async () => {
  h = await database();
  await h.db("vendors").insert({ id: 1, name: "Learning team" });
});
after(async () => {
  if (h) await h.close();
});
const api = (path = "", method = "GET", body?: unknown) =>
  request(h.origin, "/api/listings" + path, method, body);
async function create(title: string, status = "draft") {
  const r = await api("", "POST", { title, status, vendor_id: 1 });
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
    { vendor_id: "1" },
    {},
  ])
    assert.equal((await api(`/${a.id}`, "PUT", bad)).status, 400);
  assert.equal((await api(`/${a.id}`)).data.data.title, "Renamed");
  assert.equal((await api("/1e2")).status, 400);
});
test("archive and restore preserve the previous workflow state and repeats are no-ops", async () => {
  const a = await create("Lifecycle", "active");
  assert.equal((await api(`/${a.id}/archive`, "PATCH", {})).status, 200);
  const count = async () =>
    Number((await h.db("audit_log").count("* as count").first()).count);
  const once = await count();
  assert.equal((await api(`/${a.id}/archive`, "PATCH", {})).status, 200);
  assert.equal(await count(), once);
  const r = await api(`/${a.id}/restore`, "PATCH", {});
  assert.equal(r.status, 200);
  assert.equal(r.data.data.status, "active");
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
        status: "active",
      })
    ).status,
    404,
  );
  assert.equal((await api(`/${a.id}`)).data.data.status, "draft");
  const r = await api("/bulk/status", "POST", {
    ids: [a.id, a.id],
    status: "active",
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.data.length, 1);
  const audit = await h
    .db("audit_log")
    .where({ action: "bulk_status" })
    .orderBy("id", "desc")
    .first();
  assert.equal(audit.before.status, "draft");
  assert.equal(audit.after.status, "active");
  const count = await h.db("audit_log").count("* as count").first();
  await api("/bulk/status", "POST", { ids: [a.id], status: "active" });
  assert.deepEqual(await h.db("audit_log").count("* as count").first(), count);
});
test("ordinary status edits keep archive flags consistent; deleted records cannot be restored", async () => {
  const a = await create("Flags");
  await api(`/${a.id}`, "PUT", { status: "archived" });
  assert.ok((await api(`/${a.id}`)).data.data.archived_at);
  await api(`/${a.id}`, "PUT", { status: "active" });
  assert.equal((await api(`/${a.id}`)).data.data.archived_at, null);
  assert.equal((await api(`/${a.id}`, "DELETE")).status, 200);
  assert.equal((await api(`/${a.id}/restore`, "PATCH", {})).status, 404);
});
```

## Existing implementation

Archive stores the previous status in an additive migration, restore returns to that status, and repeats are no-ops. Ordinary and bulk status changes keep archive flags consistent. Bulk IDs are deduplicated; all targets are locked and checked before any change. Audit rows contain real before/after records. List refreshes ignore stale responses and use the current filters after a mutation; failed saves retain the draft and show an error.

The key model is: listings belong to the grouping reference vendor_id. Records have title, owner, priority, status, metadata, due_at, risk_level, version, archived_at and deleted_at. Status vocabulary: draft, active, flagged, paused, archived. The new nullable status_before_archive column remembers the earlier state. Comments, activity_events and audit_log reference records.

The worked fixture should behave as follows: Create a record in active, archive it twice and restore it twice. Only the actual transitions add history, and restore returns active. Bulk-update [existingId,999999]: return 404 and leave the existing row unchanged. A duplicated valid ID changes once and audit.before/status differs from audit.after/status.

## Extension solutions

### Exercise 1

**Prompt:** Display the previous status while a record is archived.

**Approach:** Read status_before_archive and label a missing legacy value honestly; do not infer an earlier state from the current badge.

**Review:** Demonstrate an ordinary case and a case that would break a naive implementation. Explain which existing invariant remains unchanged. Keep the code and the learner-facing explanation in agreement.

### Exercise 2

**Prompt:** Preview the distinct IDs affected by a bulk action.

**Approach:** Deduplicate selected IDs and show the exact target count. Keep server validation for removed or stale IDs.

**Review:** Demonstrate an ordinary case and a case that would break a naive implementation. Explain which existing invariant remains unchanged. Keep the code and the learner-facing explanation in agreement.

### Exercise 3

**Prompt:** Inject an audit-write failure and verify all bulk changes roll back.

**Approach:** Install a failure trigger in a test schema, submit multiple changes and compare every status, version and audit count with its starting state.

**Review:** Demonstrate an ordinary case and a case that would break a naive implementation. Explain which existing invariant remains unchanged. Keep the code and the learner-facing explanation in agreement.

### Exercise 4

**Prompt:** Add optimistic concurrency and genuine authorization.

**Approach:** Require an expected version and verified session identity. Scope grouping membership in server predicates; a demo role header or foreign key alone is insufficient.

**Review:** Demonstrate an ordinary case and a case that would break a naive implementation. Explain which existing invariant remains unchanged. Keep the code and the learner-facing explanation in agreement.

## Review questions with answer guidance

**Why not trust input just because it came from this UI?** A caller can bypass the UI, a saved file can be edited, and older data can have a different shape. Validate at the boundary that owns the operation.

**Why keep the id stable?** It identifies the same domain record across views and edits. Changing it can create duplicates, disconnect child records or make reconciliation impossible.

**What makes the failure test meaningful?** It observes the promised state invariant. For this project, explain exactly why the failing scenario in [test/crud.test.ts](../test/crud.test.ts) would detect the original or a plausible regression.

**What does the test not prove?** A bounded suite does not prove all concurrency, browsers, deployment configurations or unrelated domain behavior. Name the real limitation from this lesson instead of adding a generic disclaimer.

**When should you extract a helper?** When it isolates a coherent responsibility, makes an invariant clearer or enables a meaningful test without duplicating application logic. A pure validator and a shared persistence boundary are common examples, but do not abstract solely to increase the number of files.

## A sample change explanation

“The previous behavior was: Restore always assigned active, even when that was not a valid workflow state. Bulk updates could silently ignore missing IDs and audit entries lacked the actual previous record. I changed the implementation so that: Archive stores the previous status in an additive migration, restore returns to that status, and repeats are no-ops. Ordinary and bulk status changes keep archive flags consistent. Bulk IDs are deduplicated; all targets are locked and checked before any change. Audit rows contain real before/after records. List refreshes ignore stale responses and use the current filters after a mutation; failed saves retain the draft and show an error. The strongest evidence is the regression that exercises the worked fixture and checks authoritative state. A remaining design question is the final stretch exercise.”

Replace that explanation with your own words and actual test results. A strong junior engineer can connect a concrete user problem to code, verification and a clearly stated limit. Completing that explanation independently is the final checkpoint for this course.
