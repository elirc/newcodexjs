# Solutions and engineering review

[Course index](README.md) · [Practice prompts](05-PRACTICE.md)

Attempt each exercise before using these notes. These are solution approaches and review criteria, not claims that every extension has been implemented. The actual completed behavior is described in the worked-change chapter.

## Existing implementation

Create and partial-update schemas validate editable fields. Tags are trimmed, bounded and deduplicated; the model serializes JSON arrays explicitly. The typed form offers cancel, saves only editable fields, prevents duplicate submissions, retains failed drafts and ignores stale search results. Seed tags use the same explicit JSON serialization.

The key model is: Blog Platform stores posts with integer IDs and fields title, body, slug, status, tags. PostgreSQL persists rows; tags are JSONB. GET/POST /api/posts list/create and GET/PUT/DELETE /api/posts/:id read/change/remove a row. The success envelope wraps the record in data.

The worked fixture should behave as follows: POST this synthetic input: {"title": "Post title", "body": "Post body", "slug": "post-title", "status": "draft", "tags": ["blog"]}. Then PUT only {"title":"Revised lesson"} to its ID and check the other fields remain. Tags ["API"," api "] produce one logical tag. Reject a numeric title and verify the row is unchanged; delete it and check a second delete returns 404.

## Extension solutions

### Exercise 1

**Prompt:** Add a typed filter for slug while preserving search.

**Approach:** Add the field to the query type and validate it on the API; combine predicates rather than replacing the search condition.

**Review:** the slug filter must be validated in `service.list` like `search` (short string) and applied in `model.listRecords` as an exact `where("slug", ...)` combined with, not replacing, the search group; your test must show `?search=x&slug=y` returns only rows matching both and that a 256-character slug is a 400.

### Exercise 2

**Prompt:** Show a dirty-form indicator and confirm before discarding changes.

**Approach:** Compare editable draft fields with the original record; cancel should reset the draft and exit editing without a request.

**Review:** the dirty indicator must compare the draft with the original record field by field (tags as a joined string) and must clear after a successful save; cancelling a dirty draft must ask for confirmation and must not issue any request (assert `updateRecord` was not called in a client test using the `App.test.tsx` mocking pattern).

### Exercise 3

**Prompt:** Add a meaningful browser test for a slow old search response.

**Approach:** Delay response A, resolve B, then release A and assert B remains visible. Testing only request URL construction cannot prove this behavior.

**Review:** the test must resolve the older `listRecords` promise *after* the newer one and assert the newer titles remain (see `client/src/App.test.tsx`, first test); a test that only checks the request URL does not prove the guard; explain which line (`request === sequence.current`) makes it pass.

### Exercise 4

**Prompt:** Add optimistic concurrency for two editors.

**Approach:** Include a record version in reads, update with WHERE id AND version, increment on success and report a conflict when zero rows match. Keep the draft for a merge decision.

**Review:** the version must be selected with the record, sent back on `PUT`, and checked in one statement (`UPDATE ... WHERE id = ? AND version = ?` with `RETURNING *`); zero rows means 409 through a new `ConflictError` in `utils/errors.ts`; the test sends two sequential `PUT`s with the same stale version and asserts 200 then 409 with the row equal to the first result.

### Exercise 7 — ownership and authorization

Reference (the check lives in the service, before the model writes anything):

```typescript
// utils/errors.ts
export class ForbiddenError extends AppError { constructor(m = "Forbidden") { super(m, 403, "FORBIDDEN"); } }
// services/service.ts
export async function update(value: string, payload: unknown, actor: string) {
  const id = parseId(value);
  const existing = await model.findRecord(id);
  if (!existing) throw new NotFoundError("Record not found.");
  if (existing.author !== actor) throw new ForbiddenError("Only the author can edit this post.");
  return model.updateRecord(id, parsePayload(payload, true));
}
```

Reference test skeleton:

```typescript
test("only the author can change a post", async () => {
  const mine = { "X-Actor": "ana" }, other = { "X-Actor": "ben" };
  const made = (await call(route, "POST", valid, mine)).data.data;
  assert.equal((await call(route + "/" + made.id, "PUT", { title: "Taken" }, other)).status, 403);
  assert.deepEqual((await call(route + "/" + made.id)).data.data, made);
  assert.equal((await call(route + "/" + made.id, "DELETE", undefined, other)).status, 403);
  assert.equal((await call(route + "/" + made.id, "PUT", { title: "Mine" }, mine)).status, 200);
  assert.equal((await call(route + "/" + made.id, "PUT", { title: "Nobody" })).status, 401);
});
```

Review: explain why the read-then-write in `update` is safe enough here (single statement, no interleaving that changes `author`) and what you would add if authors could be reassigned concurrently (`WHERE id = ? AND author = ?` in the `UPDATE` itself).

## Review questions with answer guidance

**Why not trust input just because it came from this UI?** A caller can bypass the UI, a saved file can be edited, and older data can have a different shape. Validate at the boundary that owns the operation.

**Why keep the id stable?** It identifies the same domain record across views and edits. Changing it can create duplicates, disconnect child records or make reconciliation impossible.

**What makes the failure test meaningful?** It observes the promised state invariant. For this project, explain exactly why the failing scenario in [test/crud.test.ts](../test/crud.test.ts) would detect the original or a plausible regression.

**What does the test not prove?** A bounded suite does not prove all concurrency, browsers, deployment configurations or unrelated domain behavior. Name the real limitation from this lesson instead of adding a generic disclaimer.

**When should you extract a helper?** When it isolates a coherent responsibility, makes an invariant clearer or enables a meaningful test without duplicating application logic. A pure validator and a shared persistence boundary are common examples, but do not abstract solely to increase the number of files.

## A sample change explanation

“The previous behavior was: Request bodies reached database writes with weak validation; update forms used broad values, tag arrays were not consistently serialized for JSONB, and search responses could arrive out of order. I changed the implementation so that: Create and partial-update schemas validate editable fields. Tags are trimmed, bounded and deduplicated; the model serializes JSON arrays explicitly. The typed form offers cancel, saves only editable fields, prevents duplicate submissions, retains failed drafts and ignores stale search results. Seed tags use the same explicit JSON serialization. The strongest evidence is the regression that exercises the worked fixture and checks authoritative state. A remaining design question is the final stretch exercise.”

Replace that explanation with your own words and actual test results. A strong junior engineer can connect a concrete user problem to code, verification and a clearly stated limit. Completing that explanation independently is the final checkpoint for this course.
