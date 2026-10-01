# Worked implementation and examples

[Course index](README.md)

## Before and after

**Before:** Activating a missing or another user's environment cleared the old active flag before failing. Duplicate variable keys could fail late, and writes could compete for active selection.

**After:** Environment create/update/activate serialize on the owner row. The target is verified before clearing active flags. Variable replacement locks its environment, rejects duplicate normalized keys and preserves the prior set on failure. Saved-request headers and parameters are serialized as JSONB arrays in seeds and CRUD writes.

## Predict this example

Activate a nonexistent environment and confirm Local remains active. Concurrently activate Local and Staging: only one ends active for that user. Replacing variables with KEY and spaced KEY returns 400 and preserves BASE_URL. Sending [] explicitly clears the owned environment.

Before running anything, write the exact expected stored values and visible response. Include ids or record counts where they matter. Then run the focused tests and reproduce the matching UI/API action. Do not settle for seeing a success message: inspect the authoritative stored result as well.

## Actual implementation excerpt

The lines below are the ones Astra changed (compare `AstraOrganized2/astrafinalplan/implementation/batch04/backups/66/server/src/models/environmentModel.ts` with `diff --strip-trailing-cr -w`): `activateEnvironment` now checks the target exists before clearing the other rows and does both under the user lock, and `replaceVariables` validates duplicate keys and replaces the set inside one transaction. The linked source is authoritative if you later edit the project.

```typescript
// models/environmentModel.ts:73
export async function activateEnvironment(id: number, userId: number) {
  return db.transaction(async (trx) => {
    await trx("users").where({ id: userId }).forUpdate().first();
    const target = await trx("environments")
      .where({ id, user_id: userId })
      .first();
    if (!target) throw new NotFoundError("Environment not found");
    await trx("environments")
      .where({ user_id: userId })
      .update({ is_active: false });
    const [environment] = await trx("environments")
      .where({ id, user_id: userId })
      .update({ is_active: true, updated_at: trx.fn.now() })
      .returning("*");
    return environment;
  });
}

// models/environmentModel.ts:92
export async function replaceVariables(
  environmentId: number,
  userId: number,
  variables: Array<Record<string, unknown>>,
) {
  return db.transaction(async (trx) => {
    const environment = await trx("environments")
      .where({ id: environmentId, user_id: userId })
      .forUpdate()
      .first();
    if (!environment) return null;
    const keys = variables.map((v) => String(v.key).trim());
    if (new Set(keys).size !== keys.length)
      throw new ValidationError("Variable keys must be unique");
    await trx("env_variables")
      .where({ environment_id: environmentId })
      .delete();
    if (!variables.length) return [];
    return trx("env_variables")
      .insert(
        variables.map((variable, index) => ({
          ...variable,
```

## How to reason through the code

1. Identify the inputs. Distinguish data supplied by a caller from state read from storage or a trusted context.
2. Find the guard clauses. For each early return or thrown error, describe which invariant it protects and whether anything has already been written.
3. Find the candidate state or query. Explain whether it mutates an existing object or constructs a replacement.
4. Locate the persistence operation. For asynchronous code, follow the promise through success and rejection; for transactions, check that all related writes use the same transaction object.
5. Find the output or state publication. Ask what a repeated invocation would do after the first invocation succeeds.

Use this project-specific reasoning as your guide:

A transaction rolls back only if it fails. Returning undefined after clearing flags would commit the earlier update, even if the service later throws outside that transaction. Validate the target inside the transaction and throw there before clearing the old selection. The per-user lock also coordinates activation through metadata edits and creates.

Replacing a list is a common CRUD operation: delete the old children, insert the new children. Validate the complete candidate before deletion. Duplicate keys after trimming are ambiguous because interpolation needs one value per name; reject the candidate instead of silently choosing a winner. The endpoint intentionally accepts a JSON array, unlike most object-based CRUD requests. A blanket object-only middleware would break this valid contract.

Environment values may include secrets in normal use. The teaching examples use synthetic localhost URLs, not credentials. This task does not send proxy requests to external services. The project still uses a demo user header and has broader collection/folder ownership and proxy concerns outside this environment-focused change. The new guide separates these limitations from the implemented behavior.

## Three variations to work through

**Normal variation — switch twice.** Activate Staging, then Local. Predict: after each call exactly one row has `is_active = true` for user 1, and user 2's row is untouched. Read the rows in `psql` between calls.

**Invalid variation — a foreign environment.** Activate user 2's environment as user 1. Predict 404 `Environment not found` and user 1's active row unchanged (before the change, the clear ran first and left user 1 with no active environment). Then send variables `[{ key: " token " }, { key: "token" }]`: predict 400 `Variable keys must be unique` and the old variables intact.

**Boundary variation — the race.** Activate Local and Staging in a `Promise.all`. Predict `[200, 200]` and one active row. Then on a throwaway branch remove the user-row lock and add the partial unique index from chapter 2; repeat and record the statuses you observe (one 200 and one 23505-derived error) and the row count (still one).

## Executable examples

These are the actual regression tests in [test/environments.test.ts](../test/environments.test.ts). Read each test as arrange → act → assert. Setup creates a controlled initial state, the action exercises the application code, and assertions compare observable behavior with an independently stated expectation.

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

## Explain it back

Give a five-minute walkthrough: the original problem, one invariant, the exact changed function, the most revealing failure test, and one remaining limitation. You should be able to explain why the implementation is correct for the worked example without reading the code aloud line by line.
