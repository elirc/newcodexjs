# Trace lab: Kanban Board: a complete typed edit loop

[Course index](README.md) · [Worked change](03-WORKED-CHANGE.md) · [Tests](04-TESTING-AND-DEBUGGING.md)

## Run it before you trace it

The first executable example from chapter 03, so the trace starts from a request you have actually sent:

```typescript
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { database, request } from "./database.js";
let h;
before(async () => {
  h = await database();
});
after(async () => {
  if (h) await h.close();
});
const route = "/api/cards",
  valid = {
    title: "Card title",
    body: "Card description",
    lane: "todo",
    status: "todo",
    tags: ["product"],
  };
const call = (path = route, method = "GET", body = undefined) =>
  request(h.origin, path, method, body);
test("create/read/partial update preserves identity and omitted fields", async () => {
  const made = await call(route, "POST", valid);
  assert.equal(made.status, 201, JSON.stringify(made.data));
  const row = made.data.data;
  assert.deepEqual(row.tags, valid.tags);
  const changed = await call(route + "/" + row.id, "PUT", {
    title: "Revised fixture",
  });
  assert.equal(changed.status, 200);
  assert.equal(changed.data.data.id, row.id);
  assert.equal(changed.data.data.body, row.body);
  assert.equal(changed.data.data.title, "Revised fixture");
  assert.deepEqual(
    (await call(route + "/" + row.id)).data.data,
    changed.data.data,
  );
});
test("malformed create and edits return 400 without changing stored data", async () => {
  const made = (await call(route, "POST", valid)).data.data;
  for (const body of [
    { title: {} },
    { tags: [{}] },
    { tags: [""] },
    { title: " " },
    { title: "x".repeat(256) },
    {},
  ]) {
    assert.equal(
      (await call(route + "/" + made.id, "PUT", body)).status,
      400,
      JSON.stringify(body),
    );
  }
  assert.deepEqual((await call(route + "/" + made.id)).data.data, made);
  assert.equal((await call(route, "POST", { tags: [] })).status, 400);
  assert.equal((await call(route + "/1e2")).status, 400);
});
test("tags serialize as JSON arrays and filters compose with stable ordering", async () => {
  const made = await call(route, "POST", {
    ...valid,
    title: "DistinctAstraSearch",
    status: "active",
    tags: ["one", "ONE", "two"],
  });
  assert.equal(made.status, 201);
  assert.deepEqual(made.data.data.tags, ["ONE", "two"]);
  const found = await call(route + "?search=DistinctAstraSearch&status=active");
  assert.equal(found.data.data.length, 1);
  assert.equal(
    (await call(route + "?search=DistinctAstraSearch&status=missing")).data.data
      .length,
    0,
  );
});
test("delete removes the record and repeated operations return 404", async () => {
  const made = (await call(route, "POST", valid)).data.data;
  const path = route + "/" + made.id;
  assert.equal((await call(path, "DELETE")).status, 200);
  assert.equal((await call(path)).status, 404);
  assert.equal((await call(path, "DELETE")).status, 404);
  assert.equal(
    (await call(path, "PUT", { title: "Still absent" })).status,
    404,
  );
});
```

Watch the server log while it runs, then follow the boundaries below with that exact request in mind.

## The concrete case

This lab connects one visible action to the code that accepts or rejects it. Use a disposable dataset and write your prediction before running the operation. The goal is to explain what each boundary contributes, not to memorize a sequence of clicks.

POST this synthetic input: {"title": "Card title", "body": "Card description", "lane": "todo", "status": "todo", "tags": ["product"]}. Then PUT only {"title":"Revised lesson"} to its ID and check the other fields remain. Tags ["API"," api "] produce one logical tag. Reject a numeric title and verify the row is unchanged; delete it and check a second delete returns 404.

## Write the record before touching the form

Kanban Board stores cards with integer IDs and fields title, body, lane, status, tags. PostgreSQL persists rows; tags are JSONB. GET/POST /api/cards list/create and GET/PUT/DELETE /api/cards/:id read/change/remove a row. The success envelope wraps the record in data.

Make a small table in your own notes with these columns: field, starting value, proposed value, and source of truth. Include identity even when the form does not display it. Include related rows or stored counters when the operation changes more than one fact. Mark a value as derived if the app recomputes it rather than storing it independently.

For example, an edit can change a title while preserving an ID. A status command can keep the same status while producing no new history. An import can contain many rows yet be rejected before any replacement begins. In each case, the meaningful observation is the promised resulting state. A success toast alone cannot establish which fields changed.

## Trace the real call path

### Boundary 1

A React form, button or test sends a concrete operation.

Find the relevant call in the source for this project, starting with [server/src/services/service.ts](../server/src/services/service.ts) and `parsePayload`. Record the actual argument names and the result or side effect. At this step, ask whether the value has been validated already or is merely typed by the compiler. Write down what a rejection would prevent and which later steps would not run.

### Boundary 2

The client serializes editable values as an HTTP request.

Find the relevant call in the source for this project, starting with [server/src/services/service.ts](../server/src/services/service.ts) and `parsePayload`. Record the actual argument names and the result or side effect. At this step, ask whether the value has been validated already or is merely typed by the compiler. Write down what a rejection would prevent and which later steps would not run.

### Boundary 3

The server validates runtime input and the relevant record relationships.

Find the relevant call in the source for this project, starting with [server/src/services/service.ts](../server/src/services/service.ts) and `parsePayload`. Record the actual argument names and the result or side effect. At this step, ask whether the value has been validated already or is merely typed by the compiler. Write down what a rejection would prevent and which later steps would not run.

### Boundary 4

The repository or model reads authoritative state and performs the documented change.

Find the relevant call in the source for this project, starting with [server/src/services/service.ts](../server/src/services/service.ts) and `parsePayload`. Record the actual argument names and the result or side effect. At this step, ask whether the value has been validated already or is merely typed by the compiler. Write down what a rejection would prevent and which later steps would not run.

### Boundary 5

The storage boundary commits or rejects the operation.

Find the relevant call in the source for this project, starting with [server/src/services/service.ts](../server/src/services/service.ts) and `parsePayload`. Record the actual argument names and the result or side effect. At this step, ask whether the value has been validated already or is merely typed by the compiler. Write down what a rejection would prevent and which later steps would not run.

### Boundary 6

The response or broadcast gives the client its observed result.

Find the relevant call in the source for this project, starting with [server/src/services/service.ts](../server/src/services/service.ts) and `parsePayload`. Record the actual argument names and the result or side effect. At this step, ask whether the value has been validated already or is merely typed by the compiler. Write down what a rejection would prevent and which later steps would not run.

## Predict the regression scenarios

| Scenario from the executable suite | Prediction to write before running |
|---|---|
| create/read/partial update preserves identity and omitted fields | Initial records, request/input, expected result, and records that must remain unchanged. |
| malformed create and edits return 400 without changing stored data | Initial records, request/input, expected result, and records that must remain unchanged. |
| tags serialize as JSON arrays and filters compose with stable ordering | Initial records, request/input, expected result, and records that must remain unchanged. |
| delete removes the record and repeated operations return 404 | Initial records, request/input, expected result, and records that must remain unchanged. |

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

A create input and a stored record are different types. The database supplies identity and timestamps; the client should not resend those as editable fields. An update is a partial object: omitting body means retain it, while explicitly sending an empty body means clear it. Constructing a full object full of defaults during an edit would erase omitted data.

A PostgreSQL JSONB column is not a PostgreSQL text array. The JavaScript driver can interpret an array parameter as a SQL array representation. JSON.stringify makes the intended JSON representation explicit; read the driver result after insertion to verify the round trip. The deduplication key is lowercase trimmed text, and the last spelling of an equivalent tag is retained. Status and domain-specific lane/stage fields remain bounded free-form strings; no unimplemented workflow engine is implied.

A browser search can have A and B in flight. If B finishes first, a later A response must not replace the newer result. The request sequence counter guards that publication step. A separate mutation guard prevents a rapid repeated save from sending another create. This is client request control, not server-side POST idempotency. Error feedback preserves a learner's draft so they can fix the problem and retry.

## Change one requirement independently

**Practice task:** Add a typed filter for lane while preserving search.

Before implementation, write three acceptance criteria: an ordinary successful case, a rejected or cancelled case, and a case that preserves existing behavior. Identify the smallest file boundary that owns the rule. Keep the existing regression suite; add a test only when it observes a new promise. Do not reproduce the implementation line by line inside the assertion, because both copies can contain the same mistake.

After a first attempt, compare your design with this hint: Add the field to the query type and validate it on the API; combine predicates rather than replacing the search condition.

## Debug a disagreement between layers

If the form and response disagree, inspect the request payload before editing the database code. If the response and database disagree, inspect the mapper, transaction and read query. If a test fails before an HTTP request is logged, inspect startup, environment variables and the test fixture. Missing dependencies, a busy port or an unavailable database are different from a failed business assertion. Preserve the first useful error and fix that cause before interpreting later cascading failures.

When a date looks wrong, distinguish a calendar label from an instant and check the serialization boundary. When an optional field will not clear, distinguish omission from an explicit empty/null value. When a list seems to lose a record, inspect filtering, sorting and pagination before assuming deletion. When history duplicates, compare desired-state commands with commands that represent a new event. These are diagnostic questions to apply to the actual fields above.

## Final independent checkpoint

Close this guide and give a five-minute walkthrough using only the application source and one test. Explain the user-visible problem, the input contract, the identity model, the write boundary, a failed operation and the remaining limitation. Then modify the worked fixture and predict the result without running it. Reopen the guide only after writing your answer.

A useful review note includes the exact command run, its result, and the boundary it covers. Keep browser interaction, simulated storage tests, real HTTP/database tests and compile checks distinct. The [verification page](VERIFICATION.md) records this delivery’s evidence. Exercises and proposed extensions in this course remain learner work; they are not counted as implemented features.
