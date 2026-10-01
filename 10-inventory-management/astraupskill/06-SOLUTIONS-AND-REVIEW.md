# Solutions and engineering review

[Course index](README.md) · [Practice prompts](05-PRACTICE.md)

Attempt each exercise before using these notes. These are solution approaches and review criteria, not claims that every extension has been implemented. The actual completed behavior is described in the worked-change chapter.

## Check a solution the same way the course checks its own

Every solution below should survive the same request chapter 03 runs; send it after your change and compare the response to the expected observations in chapter 03:

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
const route = "/api/products",
  valid = {
    sku: "SKU-001",
    name: "Product",
    category: "General",
    status: "active",
    tags: ["stocked"],
  };
const call = (path = route, method = "GET", body = undefined) =>
  request(h.origin, path, method, body);
test("create/read/partial update preserves identity and omitted fields", async () => {
  const made = await call(route, "POST", valid);
  assert.equal(made.status, 201, JSON.stringify(made.data));
  const row = made.data.data;
  assert.deepEqual(row.tags, valid.tags);
  const changed = await call(route + "/" + row.id, "PUT", {
    sku: "Revised fixture",
  });
  assert.equal(changed.status, 200);
  assert.equal(changed.data.data.id, row.id);
  assert.equal(changed.data.data.name, row.name);
  assert.equal(changed.data.data.sku, "Revised fixture");
  assert.deepEqual(
    (await call(route + "/" + row.id)).data.data,
    changed.data.data,
  );
});
test("malformed create and edits return 400 without changing stored data", async () => {
  const made = (await call(route, "POST", valid)).data.data;
  for (const body of [
    { sku: {} },
    { tags: [{}] },
    { tags: [""] },
    { sku: " " },
    { sku: "x".repeat(256) },
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
    sku: "DistinctAstraSearch",
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
  assert.equal((await call(path, "PUT", { sku: "Still absent" })).status, 404);
});
```

## Existing implementation

Create and partial-update schemas validate editable fields. Tags are trimmed, bounded and deduplicated; the model serializes JSON arrays explicitly. The typed form offers cancel, saves only editable fields, prevents duplicate submissions, retains failed drafts and ignores stale search results. Seed tags use the same explicit JSON serialization.

The key model is: Inventory Management stores products with integer IDs and fields sku, name, category, status, tags. PostgreSQL persists rows; tags are JSONB. GET/POST /api/products list/create and GET/PUT/DELETE /api/products/:id read/change/remove a row. The success envelope wraps the record in data.

The worked fixture should behave as follows: POST this synthetic input: {"sku": "SKU-001", "name": "Product", "category": "General", "status": "active", "tags": ["stocked"]}. Then PUT only {"sku":"Revised lesson"} to its ID and check the other fields remain. Tags ["API"," api "] produce one logical tag. Reject a numeric sku and verify the row is unchanged; delete it and check a second delete returns 404.

## Extension solutions

### Exercise 1

**Prompt:** Add a typed category filter while preserving search.

**Approach:** Add the field to the query type and validate it on the API; combine predicates rather than replacing the search condition.

**Review:** Demonstrate an ordinary case and a case that would break a naive implementation. Explain which existing invariant remains unchanged. Keep the code and the learner-facing explanation in agreement.

### Exercise 2

**Prompt:** Show a dirty-form indicator and confirm before discarding changes.

**Approach:** Compare editable draft fields with the original record; cancel should reset the draft and exit editing without a request.

**Review:** Demonstrate an ordinary case and a case that would break a naive implementation. Explain which existing invariant remains unchanged. Keep the code and the learner-facing explanation in agreement.

### Exercise 3

**Prompt:** Add a meaningful browser test for a slow old search response.

**Approach:** Delay response A, resolve B, then release A and assert B remains visible. Testing only request URL construction cannot prove this behavior.

**Review:** Demonstrate an ordinary case and a case that would break a naive implementation. Explain which existing invariant remains unchanged. Keep the code and the learner-facing explanation in agreement.

### Exercise 4

**Prompt:** Add optimistic concurrency for two editors.

**Approach:** Include a record version in reads, update with WHERE id AND version, increment on success and report a conflict when zero rows match. Keep the draft for a merge decision.

**Review:** Demonstrate an ordinary case and a case that would break a naive implementation. Explain which existing invariant remains unchanged. Keep the code and the learner-facing explanation in agreement.

## Review questions with answer guidance

**Why not trust input just because it came from this UI?** A caller can bypass the UI, a saved file can be edited, and older data can have a different shape. Validate at the boundary that owns the operation.

**Why keep the id stable?** It identifies the same domain record across views and edits. Changing it can create duplicates, disconnect child records or make reconciliation impossible.

**What makes the failure test meaningful?** It observes the promised state invariant. For this project, explain exactly why the failing scenario in [test/crud.test.ts](../test/crud.test.ts) would detect the original or a plausible regression.

**What does the test not prove?** A bounded suite does not prove all concurrency, browsers, deployment configurations or unrelated domain behavior. Name the real limitation from this lesson instead of adding a generic disclaimer.

**When should you extract a helper?** When it isolates a coherent responsibility, makes an invariant clearer or enables a meaningful test without duplicating application logic. A pure validator and a shared persistence boundary are common examples, but do not abstract solely to increase the number of files.

## A sample change explanation

“The previous behavior was: Request bodies reached database writes with weak validation; update forms used broad values, tag arrays were not consistently serialized for JSONB, and search responses could arrive out of order. I changed the implementation so that: Create and partial-update schemas validate editable fields. Tags are trimmed, bounded and deduplicated; the model serializes JSON arrays explicitly. The typed form offers cancel, saves only editable fields, prevents duplicate submissions, retains failed drafts and ignores stale search results. Seed tags use the same explicit JSON serialization. The strongest evidence is the regression that exercises the worked fixture and checks authoritative state. A remaining design question is the final stretch exercise.”

Replace that explanation with your own words and actual test results. A strong junior engineer can connect a concrete user problem to code, verification and a clearly stated limit. Completing that explanation independently is the final checkpoint for this course.
