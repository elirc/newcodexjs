# Worked implementation and examples

[Course index](README.md)

## Before and after

**Before:** Request bodies reached database writes with weak validation; update forms used broad values, tag arrays were not consistently serialized for JSONB, and search responses could arrive out of order.

**After:** Create and partial-update schemas validate editable fields. Tags are trimmed, bounded and deduplicated; the model serializes JSON arrays explicitly. The typed form offers cancel, saves only editable fields, prevents duplicate submissions, retains failed drafts and ignores stale search results. Seed tags use the same explicit JSON serialization.

## Predict this example

POST this synthetic input: {"title": "Post title", "body": "Post body", "slug": "post-title", "status": "draft", "tags": ["blog"]}. Then PUT only {"title":"Revised lesson"} to its ID and check the other fields remain. Tags ["API"," api "] produce one logical tag. Reject a numeric title and verify the row is unchanged; delete it and check a second delete returns 404.

Before running anything, write the exact expected stored values and visible response. Include ids or record counts where they matter. Then run the focused tests and reproduce the matching UI/API action. Do not settle for seeing a success message: inspect the authoritative stored result as well.

## Actual implementation excerpt

The lines below are the ones Astra changed (Astra compared a pre-change backup, `AstraOrganized2/astrafinalplan/implementation/batch04/backups/58`, using `diff -r --strip-trailing-cr -w`; that folder is not part of this repository, but the same before/after is in git: `git diff 76a946e 32a962c -- server/src/services/service.ts server/src/models/model.ts`): `parsePayload` validates with Zod and treats a `PUT` as partial, the list query searches per text column instead of casting the whole row, and `databasePayload` serializes `tags` only when present. The linked source is authoritative if you later edit the project.

```typescript
// server/src/services/service.ts:22
function parsePayload(payload: unknown, partial = false) {
  const result = (partial ? recordSchema.partial() : recordSchema).safeParse(
    payload,
  );
  if (!result.success)
    throw new ValidationError(
      result.error.issues
        .map((issue) => issue.path.join(".") + ": " + issue.message)
        .join("; "),
    );
  if (!Object.keys(result.data).length)
    throw new ValidationError("Provide at least one editable field.");
  return result.data;
}

// server/src/models/model.ts:4
export function listRecords(query: { search?: string; status?: string }) {
  const builder = db("posts")
    .select("*")
    .orderBy("created_at", "desc")
    .orderBy("id", "asc");
  if (query.status) builder.where("status", query.status);
  if (query.search)
    builder.where(function () {
      ["title", "body", "slug", "status"].forEach((field) =>
        this.orWhereILike(field, `%${query.search}%`),
      );
    });
  return builder;
}

// server/src/models/model.ts:58
function databasePayload(payload: Record<string, unknown>) {
  return payload.tags === undefined
    ? payload
    : { ...payload, tags: JSON.stringify(payload.tags) };
}
```

## How to reason through the code

1. Identify the inputs. Distinguish data supplied by a caller from state read from storage or a trusted context.
2. Find the guard clauses. For each early return or thrown error, describe which invariant it protects and whether anything has already been written.
3. Find the candidate state or query. Explain whether it mutates an existing object or constructs a replacement.
4. Locate the persistence operation. For asynchronous code, follow the promise through success and rejection; for transactions, check that all related writes use the same transaction object.
5. Find the output or state publication. Ask what a repeated invocation would do after the first invocation succeeds.

Use this project-specific reasoning as your guide:

A create input and a stored record are different types. The database supplies identity and timestamps; the client should not resend those as editable fields. An update is a partial object: omitting body means retain it, while explicitly sending an empty body means clear it. Constructing a full object full of defaults during an edit would erase omitted data.

A PostgreSQL JSONB column is not a PostgreSQL text array. The JavaScript driver can interpret an array parameter as a SQL array representation. JSON.stringify makes the intended JSON representation explicit; read the driver result after insertion to verify the round trip. The deduplication key is lowercase trimmed text, and the last spelling of an equivalent tag is retained. Status and domain-specific lane/stage fields remain bounded free-form strings; no unimplemented workflow engine is implied.

A browser search can have A and B in flight. If B finishes first, a later A response must not replace the newer result. The request sequence counter guards that publication step. A separate mutation guard prevents a rapid repeated save from sending another create. This is client request control, not server-side POST idempotency. Error feedback preserves a learner's draft so they can fix the problem and retry.

## Three variations to work through

**Normal variation — a partial edit.** `PUT /api/posts/:id` with only `{ "status": "published" }`. Predict: 200, `status` changed, `title`, `body`, `slug` and `tags` identical to the row before, `updated_at` newer. Then `PUT` with `{ "tags": [] }`: predict what `databasePayload` sends and what the `jsonb` column holds afterwards.

**Invalid variation — an empty edit.** `PUT` with `{}`. Predict: 400 `Provide at least one editable field.` and the row unchanged. Then `PUT` with `{ "tags": ["a", "A", ""] }`: predict which part of `recordSchema` rejects it (the empty string, before the de-duplication transform runs).

**Boundary variation — the search that used to match everything.** On the pre-change code (`backups/58`), `?search=2026` matched every row because `CAST(posts AS TEXT)` includes timestamps. Predict what the current `listRecords` returns for `?search=2026` when no title, body, slug or status contains it (nothing), then confirm in `psql` with `EXPLAIN` that the query has one `ILIKE` per text column.

## Executable examples

These are the actual regression tests in [test/crud.test.ts](../test/crud.test.ts). Read each test as arrange → act → assert. Setup creates a controlled initial state, the action exercises the application code, and assertions compare observable behavior with an independently stated expectation.

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

## Explain it back

Give a five-minute walkthrough: the original problem, one invariant, the exact changed function, the most revealing failure test, and one remaining limitation. You should be able to explain why the implementation is correct for the worked example without reading the code aloud line by line.
