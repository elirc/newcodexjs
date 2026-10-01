# Trace lab: Learning Management System: lifecycle and bulk edits

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
  await h.db("schools").insert({ id: 1, name: "Learning team" });
});
after(async () => {
  if (h) await h.close();
});
const api = (path = "", method = "GET", body?: unknown) =>
  request(h.origin, "/api/courses" + path, method, body);
async function create(title: string, status = "draft") {
  const r = await api("", "POST", { title, status, school_id: 1 });
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
    { school_id: "1" },
    {},
  ])
    assert.equal((await api(`/${a.id}`, "PUT", bad)).status, 400);
  assert.equal((await api(`/${a.id}`)).data.data.title, "Renamed");
  assert.equal((await api("/1e2")).status, 400);
});
test("archive and restore preserve the previous workflow state and repeats are no-ops", async () => {
  const a = await create("Lifecycle", "review");
  assert.equal((await api(`/${a.id}/archive`, "PATCH", {})).status, 200);
  const count = async () =>
    Number((await h.db("audit_log").count("* as count").first()).count);
  const once = await count();
  assert.equal((await api(`/${a.id}/archive`, "PATCH", {})).status, 200);
  assert.equal(await count(), once);
  const r = await api(`/${a.id}/restore`, "PATCH", {});
  assert.equal(r.status, 200);
  assert.equal(r.data.data.status, "review");
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
        status: "review",
      })
    ).status,
    404,
  );
  assert.equal((await api(`/${a.id}`)).data.data.status, "draft");
  const r = await api("/bulk/status", "POST", {
    ids: [a.id, a.id],
    status: "review",
  });
  assert.equal(r.status, 200);
  assert.equal(r.data.data.length, 1);
  const audit = await h
    .db("audit_log")
    .where({ action: "bulk_status" })
    .orderBy("id", "desc")
    .first();
  assert.equal(audit.before.status, "draft");
  assert.equal(audit.after.status, "review");
  const count = await h.db("audit_log").count("* as count").first();
  await api("/bulk/status", "POST", { ids: [a.id], status: "review" });
  assert.deepEqual(await h.db("audit_log").count("* as count").first(), count);
});
test("ordinary status edits keep archive flags consistent; deleted records cannot be restored", async () => {
  const a = await create("Flags");
  await api(`/${a.id}`, "PUT", { status: "archived" });
  assert.ok((await api(`/${a.id}`)).data.data.archived_at);
  await api(`/${a.id}`, "PUT", { status: "review" });
  assert.equal((await api(`/${a.id}`)).data.data.archived_at, null);
  assert.equal((await api(`/${a.id}`, "DELETE")).status, 200);
  assert.equal((await api(`/${a.id}/restore`, "PATCH", {})).status, 404);
});
```

Watch the server log while it runs, then follow the boundaries below with that exact request in mind.

## The concrete case

This lab connects one visible action to the code that accepts or rejects it. Use a disposable dataset and write your prediction before running the operation. The goal is to explain what each boundary contributes, not to memorize a sequence of clicks.

Create a record in review, archive it twice and restore it twice. Only the actual transitions add history, and restore returns review. Bulk-update [existingId,999999]: return 404 and leave the existing row unchanged. A duplicated valid ID changes once and audit.before/status differs from audit.after/status.

## Write the record before touching the form

courses belong to the grouping reference school_id. Records have title, owner, priority, status, metadata, due_at, risk_level, version, archived_at and deleted_at. Status vocabulary: draft, review, published, retired, archived. The new nullable status_before_archive column remembers the earlier state. Comments, activity_events and audit_log reference records.

Make a small table in your own notes with these columns: field, starting value, proposed value, and source of truth. Include identity even when the form does not display it. Include related rows or stored counters when the operation changes more than one fact. Mark a value as derived if the app recomputes it rather than storing it independently.

For example, an edit can change a title while preserving an ID. A status command can keep the same status while producing no new history. An import can contain many rows yet be rejected before any replacement begins. In each case, the meaningful observation is the promised resulting state. A success toast alone cannot establish which fields changed.

## Trace the real call path

### Boundary 1

A React form, button or test sends a concrete operation.

Find the relevant call in the source for this project, starting with [server/src/models/model.ts](../server/src/models/model.ts) and `lifecycleUpdate`. Record the actual argument names and the result or side effect. At this step, ask whether the value has been validated already or is merely typed by the compiler. Write down what a rejection would prevent and which later steps would not run.

### Boundary 2

The client serializes editable values as an HTTP request.

Find the relevant call in the source for this project, starting with [server/src/models/model.ts](../server/src/models/model.ts) and `lifecycleUpdate`. Record the actual argument names and the result or side effect. At this step, ask whether the value has been validated already or is merely typed by the compiler. Write down what a rejection would prevent and which later steps would not run.

### Boundary 3

The server validates runtime input and the relevant record relationships.

Find the relevant call in the source for this project, starting with [server/src/models/model.ts](../server/src/models/model.ts) and `lifecycleUpdate`. Record the actual argument names and the result or side effect. At this step, ask whether the value has been validated already or is merely typed by the compiler. Write down what a rejection would prevent and which later steps would not run.

### Boundary 4

The repository or model reads authoritative state and performs the documented change.

Find the relevant call in the source for this project, starting with [server/src/models/model.ts](../server/src/models/model.ts) and `lifecycleUpdate`. Record the actual argument names and the result or side effect. At this step, ask whether the value has been validated already or is merely typed by the compiler. Write down what a rejection would prevent and which later steps would not run.

### Boundary 5

The storage boundary commits or rejects the operation.

Find the relevant call in the source for this project, starting with [server/src/models/model.ts](../server/src/models/model.ts) and `lifecycleUpdate`. Record the actual argument names and the result or side effect. At this step, ask whether the value has been validated already or is merely typed by the compiler. Write down what a rejection would prevent and which later steps would not run.

### Boundary 6

The response or broadcast gives the client its observed result.

Find the relevant call in the source for this project, starting with [server/src/models/model.ts](../server/src/models/model.ts) and `lifecycleUpdate`. Record the actual argument names and the result or side effect. At this step, ask whether the value has been validated already or is merely typed by the compiler. Write down what a rejection would prevent and which later steps would not run.

## Predict the regression scenarios

| Scenario from the executable suite | Prediction to write before running |
|---|---|
| partial edit preserves omitted values; invalid edits leave stored values unchanged | Initial records, request/input, expected result, and records that must remain unchanged. |
| archive and restore preserve the previous workflow state and repeats are no-ops | Initial records, request/input, expected result, and records that must remain unchanged. |
| bulk status rejects missing IDs atomically and records real before/after values | Initial records, request/input, expected result, and records that must remain unchanged. |
| ordinary status edits keep archive flags consistent; deleted records cannot be restored | Initial records, request/input, expected result, and records that must remain unchanged. |

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

Archive is a lifecycle operation with two related facts: a status and an archived timestamp. Setting one without the other makes filters disagree with the badge. The statusFields helper synchronizes those fields whether the request came from an archive button, a form or a bulk command. Restoring should return a courses record to its previous workflow state. A legacy archived row without the new saved field falls back to draft; the migration does not invent a historical state it cannot know.

Bulk editing should have explicit missing-target semantics. This implementation rejects the whole batch when any requested record is missing or soft-deleted. It deduplicates IDs before comparing lengths, locks targets in ID order and skips rows already at the desired status. Every changed record receives an audit entry with the actual previous and resulting values. A misleading before:null would make it harder to explain what changed.

The server validates partial fields before writing and keeps IDs stable. The version increments on change, but this is not yet optimistic concurrency: a client does not send an expected version. A row lock serializes writes; it does not detect a stale full-form edit. The role header is a demo mechanism, and school_id is a grouping foreign key rather than an enforced tenant boundary. The scaffold demonstrates administration, not every operational feature suggested by its product name.

## Change one requirement independently

**Practice task:** Display the previous status while a record is archived.

Before implementation, write three acceptance criteria: an ordinary successful case, a rejected or cancelled case, and a case that preserves existing behavior. Identify the smallest file boundary that owns the rule. Keep the existing regression suite; add a test only when it observes a new promise. Do not reproduce the implementation line by line inside the assertion, because both copies can contain the same mistake.

After a first attempt, compare your design with this hint: Read status_before_archive and label a missing legacy value honestly; do not infer an earlier state from the current badge.

## Debug a disagreement between layers

If the form and response disagree, inspect the request payload before editing the database code. If the response and database disagree, inspect the mapper, transaction and read query. If a test fails before an HTTP request is logged, inspect startup, environment variables and the test fixture. Missing dependencies, a busy port or an unavailable database are different from a failed business assertion. Preserve the first useful error and fix that cause before interpreting later cascading failures.

When a date looks wrong, distinguish a calendar label from an instant and check the serialization boundary. When an optional field will not clear, distinguish omission from an explicit empty/null value. When a list seems to lose a record, inspect filtering, sorting and pagination before assuming deletion. When history duplicates, compare desired-state commands with commands that represent a new event. These are diagnostic questions to apply to the actual fields above.

## Final independent checkpoint

Close this guide and give a five-minute walkthrough using only the application source and one test. Explain the user-visible problem, the input contract, the identity model, the write boundary, a failed operation and the remaining limitation. Then modify the worked fixture and predict the result without running it. Reopen the guide only after writing your answer.

A useful review note includes the exact command run, its result, and the boundary it covers. Keep browser interaction, simulated storage tests, real HTTP/database tests and compile checks distinct. The [verification page](VERIFICATION.md) records this delivery’s evidence. Exercises and proposed extensions in this course remain learner work; they are not counted as implemented features.
