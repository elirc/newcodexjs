# Trace lab: API Tester: safe environment replacement

[Course index](README.md) · [Worked change](03-WORKED-CHANGE.md) · [Tests](04-TESTING-AND-DEBUGGING.md)

## Run it before you trace it

The first executable example from chapter 03, so the trace starts from a request you have actually sent:

```typescript
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
```

Watch the server log while it runs, then follow the boundaries below with that exact request in mind.

## The concrete case

This lab connects one visible action to the code that accepts or rejects it. Use a disposable dataset and write your prediction before running the operation. The goal is to explain what each boundary contributes, not to memorize a sequence of clicks.

Activate a nonexistent environment and confirm Local remains active. Concurrently activate Local and Staging: only one ends active for that user. Replacing variables with KEY and spaced KEY returns 400 and preserves BASE_URL. Sending [] explicitly clears the owned environment.

## Write the record before touching the form

Users own environments, which own env_variables. Exactly one environment is selected through the application activation paths, unless the user explicitly deactivates all. Variables have key, value, is_secret and sort_order. Saved requests and proxy history are separate domains.

Make a small table in your own notes with these columns: field, starting value, proposed value, and source of truth. Include identity even when the form does not display it. Include related rows or stored counters when the operation changes more than one fact. Mark a value as derived if the app recomputes it rather than storing it independently.

For example, an edit can change a title while preserving an ID. A status command can keep the same status while producing no new history. An import can contain many rows yet be rejected before any replacement begins. In each case, the meaningful observation is the promised resulting state. A success toast alone cannot establish which fields changed.

## Trace the real call path

### Boundary 1 — the environment switcher decides what to send

`client/src/features/environments/components/*`: the switcher renders the user's environments and calls `activateEnvironment(id)` from `client/src/services/api.ts:58` on click; the variables editor sends the whole variable list to the replace endpoint. The UI shows the active badge from the server's `is_active` flag after the query refetches, which is exactly what exercise 1 asks you to make explicit.

### Boundary 2 — the request leaves the browser

`client/src/services/api.ts`: `POST /environments/:id/activate` with no body; `PUT /environments/:id/variables` with `{ variables: [...] }`; the axios instance adds the demo `x-user-id`. `unwrap()` reads the envelope, so the 404 for a foreign environment arrives as `Environment not found` and is indistinguishable from a missing id.

### Boundary 3 — the route validates the shape

`server/src/routes/index.ts` mounts `validateBody(schema)` from `middleware/validate.ts` with the Zod schemas in `validators/schemas.ts` (environment names, variable `{ key, value, enabled }` arrays, saved-request header/parameter arrays); `middleware/requestContext.ts` resolves the demo user. Activation has no body to validate; ownership is decided below.

### Boundary 4 — the service delegates; the model owns the invariant

`services/environmentService.ts:38` `activateEnvironment(userId, id)` calls the model and returns the row. `models/environmentModel.ts:73`: `db.transaction` -> lock the user row -> load the target scoped by `{ id, user_id }` (404 if foreign or missing, and the transaction ends with nothing written, which the first test checks by re-reading the previously active row) -> `UPDATE environments SET is_active = false WHERE user_id = ?` -> `UPDATE ... SET is_active = true WHERE id = ? AND user_id = ? RETURNING *`. Before Astra's change the clear ran before the existence check, so a bad id deactivated everything.

### Boundary 5 — PostgreSQL commits both updates or neither

The clear and the set are two statements in one transaction; a failure between them rolls both back, which is why `replaceVariables` (line 92) can safely `DELETE` all variables and re-insert: the third test rejects duplicate keys and shows the original variables intact. Saved-request header and parameter arrays are `jsonb` columns; the fourth test proves they round-trip through create, partial edit and duplication.

### Boundary 6 — the envelope tells the client what happened

`utils/response.ts` `sendSuccess` returns `{ success: true, data }`; `errorMiddleware.ts` maps `NotFoundError` to 404 and `ValidationError` to 400. After activation the client invalidates the environments query and re-renders badges from the committed rows.

## Predict the regression scenarios

| Scenario from the executable suite | Prediction to write before running |
|---|---|
| failed activation preserves the previous active environment | Initial records, request/input, expected result, and records that must remain unchanged. |
| concurrent activation and metadata edits retain one active environment per user | Initial records, request/input, expected result, and records that must remain unchanged. |
| variable replacement accepts arrays, rejects duplicate keys atomically, and supports clearing | Initial records, request/input, expected result, and records that must remain unchanged. |
| saved request header/parameter arrays survive create, partial edit and duplication | Initial records, request/input, expected result, and records that must remain unchanged. |

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

A transaction rolls back only if it fails. Returning undefined after clearing flags would commit the earlier update, even if the service later throws outside that transaction. Validate the target inside the transaction and throw there before clearing the old selection. The per-user lock also coordinates activation through metadata edits and creates.

Replacing a list is a common CRUD operation: delete the old children, insert the new children. Validate the complete candidate before deletion. Duplicate keys after trimming are ambiguous because interpolation needs one value per name; reject the candidate instead of silently choosing a winner. The endpoint intentionally accepts a JSON array, unlike most object-based CRUD requests. A blanket object-only middleware would break this valid contract.

Environment values may include secrets in normal use. The teaching examples use synthetic localhost URLs, not credentials. This task does not send proxy requests to external services. The project still uses a demo user header and has broader collection/folder ownership and proxy concerns outside this environment-focused change. The new guide separates these limitations from the implemented behavior.

## Change one requirement independently

**Practice task:** Show an active badge only after the activation request succeeds.

Before implementation, write three acceptance criteria: an ordinary successful case, a rejected or cancelled case, and a case that preserves existing behavior. Identify the smallest file boundary that owns the rule. Keep the existing regression suite; add a test only when it observes a new promise. Do not reproduce the implementation line by line inside the assertion, because both copies can contain the same mistake.

After a first attempt, compare your design with this hint: Keep the previous badge until the server returns the committed selection; on failure show the error and retain the old state.

## Debug a disagreement between layers

If the form and response disagree, inspect the request payload before editing the database code. If the response and database disagree, inspect the mapper, transaction and read query. If a test fails before an HTTP request is logged, inspect startup, environment variables and the test fixture. Missing dependencies, a busy port or an unavailable database are different from a failed business assertion. Preserve the first useful error and fix that cause before interpreting later cascading failures.

When a date looks wrong, distinguish a calendar label from an instant and check the serialization boundary. When an optional field will not clear, distinguish omission from an explicit empty/null value. When a list seems to lose a record, inspect filtering, sorting and pagination before assuming deletion. When history duplicates, compare desired-state commands with commands that represent a new event. These are diagnostic questions to apply to the actual fields above.

## Final independent checkpoint

Close this guide and give a five-minute walkthrough using only the application source and one test. Explain the user-visible problem, the input contract, the identity model, the write boundary, a failed operation and the remaining limitation. Then modify the worked fixture and predict the result without running it. Reopen the guide only after writing your answer.

A useful review note includes the exact command run, its result, and the boundary it covers. Keep browser interaction, simulated storage tests, real HTTP/database tests and compile checks distinct. The [verification page](VERIFICATION.md) records this delivery’s evidence. Exercises and proposed extensions in this course remain learner work; they are not counted as implemented features.
