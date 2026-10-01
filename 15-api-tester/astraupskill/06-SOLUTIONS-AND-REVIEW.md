# Solutions and engineering review

[Course index](README.md) · [Practice prompts](05-PRACTICE.md)

Attempt each exercise before using these notes. These are solution approaches and review criteria, not claims that every extension has been implemented. The actual completed behavior is described in the worked-change chapter.

## Existing implementation

Environment create/update/activate serialize on the owner row. The target is verified before clearing active flags. Variable replacement locks its environment, rejects duplicate normalized keys and preserves the prior set on failure. Saved-request headers and parameters are serialized as JSONB arrays in seeds and CRUD writes.

The key model is: Users own environments, which own env_variables. Exactly one environment is selected through the application activation paths, unless the user explicitly deactivates all. Variables have key, value, is_secret and sort_order. Saved requests and proxy history are separate domains.

The worked fixture should behave as follows: Activate a nonexistent environment and confirm Local remains active. Concurrently activate Local and Staging: only one ends active for that user. Replacing variables with KEY and spaced KEY returns 400 and preserves BASE_URL. Sending [] explicitly clears the owned environment.

## Extension solutions

### Exercise 1

**Prompt:** Show an active badge only after the activation request succeeds.

**Approach:** Keep the previous badge until the server returns the committed selection; on failure show the error and retain the old state.

**Review:** the badge must move only after the activation mutation resolves and the environments query refetches; on a failed activation (mock a 404) the previous badge must remain; assert both in a client test using the mocking pattern from the blog-platform course, and assert in a server test that a failed activation leaves `is_active` unchanged (the first test already does this).

### Exercise 2

**Prompt:** Add a duplicate-key hint while editing variables.

**Approach:** Use the same trim rule as the server and highlight both conflicting rows, while retaining authoritative server validation.

**Review:** the hint must use the same normalization as `replaceVariables` (`String(v.key).trim()`), highlight both conflicting rows, and must not disable the server check; prove the server still returns 400 for a duplicate that the client failed to flag (send it through the API directly).

### Exercise 3

**Prompt:** Force an insert failure halfway through replacement and check the original variables.

**Approach:** Use a disposable trigger and compare ordered key/value pairs before and after failure. A transaction must include delete and every insert.

**Review:** install a `BEFORE INSERT` trigger on `env_variables` that raises on the second row, submit three variables, assert 400/500 as appropriate, then assert the original ordered key/value pairs are unchanged; explain which statement in `replaceVariables` had already run (the `DELETE`) and why the transaction made it disappear.

### Exercise 4

**Prompt:** Add ownership checks to collection/folder/request moves.

**Approach:** Verify that both source and destination belong to the signed-in user and that folder/collection IDs agree. Test cross-owner references before any move writes.

**Review:** every move must load both the source and the destination with `user_id = ?` in the same query or transaction, reject a cross-owner reference with 404 before writing, and verify that the folder belongs to the target collection; your test must attempt a move into another user's collection and assert nothing changed.

### Exercise 7 — ownership on collections, folders and requests

Reference helper:

```typescript
async function assertOwned(trx: Knex.Transaction, table: string, id: number, userId: number) {
  const row = await trx(table).where({ id, user_id: userId }).forUpdate().first();
  if (!row) throw new NotFoundError(`${table.slice(0, -1)} not found`);
  return row;
}
```

Reference test skeleton: `api("/collections", "POST", { name: "Mine" })` as user 1 -> id; as user 2 (`x-user-id: 2`) `api("/collections/" + id + "/folders", "POST", { name: "Sneaky" })` -> 404 and folder count unchanged; `api("/collections/" + id, "PUT", { name: "Taken" })` -> 404 and name unchanged.

Review: explain why 404 rather than 403, and why the ownership lookup uses `forUpdate()` (it doubles as the lock that keeps the parent from being deleted or re-owned during the write).

## Review questions with answer guidance

**Why not trust input just because it came from this UI?** A caller can bypass the UI, a saved file can be edited, and older data can have a different shape. Validate at the boundary that owns the operation.

**Why keep the id stable?** It identifies the same domain record across views and edits. Changing it can create duplicates, disconnect child records or make reconciliation impossible.

**What makes the failure test meaningful?** It observes the promised state invariant. For this project, explain exactly why the failing scenario in [test/environments.test.ts](../test/environments.test.ts) would detect the original or a plausible regression.

**What does the test not prove?** A bounded suite does not prove all concurrency, browsers, deployment configurations or unrelated domain behavior. Name the real limitation from this lesson instead of adding a generic disclaimer.

**When should you extract a helper?** When it isolates a coherent responsibility, makes an invariant clearer or enables a meaningful test without duplicating application logic. A pure validator and a shared persistence boundary are common examples, but do not abstract solely to increase the number of files.

## A sample change explanation

“The previous behavior was: Activating a missing or another user's environment cleared the old active flag before failing. Duplicate variable keys could fail late, and writes could compete for active selection. I changed the implementation so that: Environment create/update/activate serialize on the owner row. The target is verified before clearing active flags. Variable replacement locks its environment, rejects duplicate normalized keys and preserves the prior set on failure. Saved-request headers and parameters are serialized as JSONB arrays in seeds and CRUD writes. The strongest evidence is the regression that exercises the worked fixture and checks authoritative state. A remaining design question is the final stretch exercise.”

Replace that explanation with your own words and actual test results. A strong junior engineer can connect a concrete user problem to code, verification and a clearly stated limit. Completing that explanation independently is the final checkpoint for this course.
