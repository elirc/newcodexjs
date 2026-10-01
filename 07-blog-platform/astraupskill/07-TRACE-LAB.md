# Trace lab: Blog Platform: a complete typed edit loop

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
const route = "/api/posts",
  valid = {
    title: "Post title",
    body: "Post body",
    slug: "post-title",
    status: "draft",
    tags: ["blog"],
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

POST this synthetic input: {"title": "Post title", "body": "Post body", "slug": "post-title", "status": "draft", "tags": ["blog"]}. Then PUT only {"title":"Revised lesson"} to its ID and check the other fields remain. Tags ["API"," api "] produce one logical tag. Reject a numeric title and verify the row is unchanged; delete it and check a second delete returns 404.

## Write the record before touching the form

Blog Platform stores posts with integer IDs and fields title, body, slug, status, tags. PostgreSQL persists rows; tags are JSONB. GET/POST /api/posts list/create and GET/PUT/DELETE /api/posts/:id read/change/remove a row. The success envelope wraps the record in data.

Make a small table in your own notes with these columns: field, starting value, proposed value, and source of truth. Include identity even when the form does not display it. Include related rows or stored counters when the operation changes more than one fact. Mark a value as derived if the app recomputes it rather than storing it independently.

For example, an edit can change a title while preserving an ID. A status command can keep the same status while producing no new history. An import can contain many rows yet be rejected before any replacement begins. In each case, the meaningful observation is the promised resulting state. A success toast alone cannot establish which fields changed.

## Trace the real call path

### Boundary 1 — the React form decides what to send, and refuses to send twice

`client/src/App.tsx`: `saveRecord` (line 72) returns immediately when `mutation.current` is already true, then sets it and `pending` before calling `updateRecord` or `createRecord`; the `<fieldset disabled={pending}>` greys the form at the same time. `refresh` (line 30) stamps each request with `++sequence.current` and ignores any response whose stamp is stale; the search effect (line 47) debounces 150 ms and bumps the sequence on cleanup. `client/src/App.test.tsx` proves both guards without a server.

### Boundary 2 — the client serializes the operation through the API envelope

`client/src/services/api.ts`: an `axios` instance with `baseURL` from `VITE_API_URL`; `createRecord` posts to `/posts`, `updateRecord` puts to `/posts/:id`. The response interceptor turns a non-2xx into `Error(error.response.data.error.message)`, and `unwrap()` reads the `{ success, data, error }` envelope. So the text in the red `role="alert"` box is the server's Zod message, verbatim.

### Boundary 3 — the route and service validate at runtime with Zod

`server/src/routes/routes.ts` wraps every controller in `wrap()` so a rejected promise reaches `errorMiddleware`. The controller (`controllers/controller.ts`) passes `req.body` untouched to `service.create` / `service.update`. `parsePayload` (`services/service.ts:22`) runs `recordSchema` (or `recordSchema.partial()` for a `PUT`) with `safeParse`, joins every issue into one message, and rejects an empty object with `Provide at least one editable field.`; `parseId` (line 17) rejects `1e2` and non-positive ids before any query. `tags` are de-duplicated case-insensitively by the schema's `transform`.

### Boundary 4 — the model shapes the row and lets Knex build the SQL

`models/model.ts`: `databasePayload` (line 58) JSON-serializes `tags` only when the key is present, which is what makes a partial `PUT` leave `tags` alone (the `jsonb` column keeps its value). `updateRecord` (line 31) is one `UPDATE ... WHERE id = ? RETURNING *` with `updated_at = now()`; `listRecords` (line 4) builds an `ILIKE` per text column inside one `where` group instead of the old `CAST(posts AS TEXT) ILIKE`, so ids and timestamps no longer match a search, and orders by `created_at DESC, id ASC` for a stable page.

### Boundary 5 — PostgreSQL commits or rejects

The `posts` table (`server/db/migrations/001_init.ts`) declares `tags jsonb NOT NULL DEFAULT '[]'`. Each route is a single statement, so there is no explicit transaction: the row is either updated or not. In tests the statement runs inside a throwaway schema that `test/database.ts` created and migrated; `RETURNING *` gives the model the committed row rather than the request body.

### Boundary 6 — the envelope tells the client what happened

`utils/response.ts` `sendSuccess` answers `{ success: true, data }` with 200 or 201; `middleware/errorMiddleware.ts` maps a thrown `AppError` (`ValidationError` 400, `NotFoundError` 404) to `{ success: false, error: { message, code } }` and anything else to 500. The client's `unwrap()` and interceptor are the mirror image of these two functions; after a successful save `saveRecord` calls `refresh()` so the list is a fresh read, not the response.

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

**Practice task:** Add a typed filter for slug while preserving search.

Before implementation, write three acceptance criteria: an ordinary successful case, a rejected or cancelled case, and a case that preserves existing behavior. Identify the smallest file boundary that owns the rule. Keep the existing regression suite; add a test only when it observes a new promise. Do not reproduce the implementation line by line inside the assertion, because both copies can contain the same mistake.

After a first attempt, compare your design with this hint: Add the field to the query type and validate it on the API; combine predicates rather than replacing the search condition.

## Debug a disagreement between layers

If the form and response disagree, inspect the request payload before editing the database code. If the response and database disagree, inspect the mapper, transaction and read query. If a test fails before an HTTP request is logged, inspect startup, environment variables and the test fixture. Missing dependencies, a busy port or an unavailable database are different from a failed business assertion. Preserve the first useful error and fix that cause before interpreting later cascading failures.

When a date looks wrong, distinguish a calendar label from an instant and check the serialization boundary. When an optional field will not clear, distinguish omission from an explicit empty/null value. When a list seems to lose a record, inspect filtering, sorting and pagination before assuming deletion. When history duplicates, compare desired-state commands with commands that represent a new event. These are diagnostic questions to apply to the actual fields above.

## Final independent checkpoint

Close this guide and give a five-minute walkthrough using only the application source and one test. Explain the user-visible problem, the input contract, the identity model, the write boundary, a failed operation and the remaining limitation. Then modify the worked fixture and predict the result without running it. Reopen the guide only after writing your answer.

A useful review note includes the exact command run, its result, and the boundary it covers. Keep browser interaction, simulated storage tests, real HTTP/database tests and compile checks distinct. The [verification page](VERIFICATION.md) records this delivery’s evidence. Exercises and proposed extensions in this course remain learner work; they are not counted as implemented features.
