# Solutions and engineering review

[Course index](README.md) · [Practice prompts](05-PRACTICE.md)

Attempt each exercise before using these notes. These are solution approaches and review criteria, not claims that every extension has been implemented. The actual completed behavior is described in the worked-change chapter.

## Existing implementation

The update locks and checks ownership within the transaction. Nested input is validated without silently dropping invalid children. The model update also scopes by owner. Real HTTP tests deny a signed-in nonowner, and real foreign-key failures prove both create and replacement rollback.

The key model is: A recipe belongs to a user and has ingredients, steps and category links. Authentication identifies the caller. Authorization compares that caller with the stored owner. A graph replacement must commit the recipe and every dependent row together.

The worked fixture should behave as follows: Alice creates a private Soup recipe with Water and a Boil step. Bob sends a valid token and a body claiming Alice’s user_id: the update must still fail with 403. Alice then attempts a replacement with a nonexistent category id; after failure, the original title, ingredient ids and steps must still exist unchanged.

## Extension solutions

### Exercise 1

**Prompt:** Add version-based conflict detection for concurrent owner edits.

**Approach:** Accept an expected version and condition the update on it inside the transaction; increment on success and return a conflict for a stale version. A row lock alone does not tell the client that its edit was stale.

**Review:** the version check must run on the row returned by `SELECT ... FOR UPDATE` inside the transaction; the test issues two sequential `PUT`s with the same `expectedVersion` and asserts 200 then 409 with the stored row equal to the first result; a client that omits `expectedVersion` must still succeed.

### Exercise 2

**Prompt:** Return field-path validation errors such as ingredients[2].name.

**Approach:** Carry the array index into validation helpers and collect a structured path/message; keep errors free of SQL or secret data.

**Review:** field paths must come from the helper calls (`text(item.name, \`ingredients[${i}].name\`, ...)`), be asserted exactly in a test (`ingredients[2].name must be non-empty text ...`), and must not change any success path.

### Exercise 3

**Prompt:** Add an ownership regression for private favorites.

**Approach:** Create a private recipe, authenticate a different user and call favorite; assert denial and no favorites row.

**Review:** the favorites regression must show that favoriting a private recipe you cannot read is 403 (not 201), that the junction row is not created, and that the owner can still favorite their own private recipe.

### Exercise 4

**Prompt:** Test rollback when replacing both steps and categories fails late.

**Approach:** Snapshot all child tables, force a late FK/constraint failure through a valid-shaped payload, and compare the complete graph after rollback, including original ids.

**Review:** the late-failure test must break the *second* replacement (categories, after steps succeeded) with a trigger or an invalid id inserted after validation, and assert the recipe, steps and categories all equal their pre-request values.

### Exercise 1 — worked example: a version column for stale edits

The row lock in `updateRecipeForUser` prevents torn writes; a `version` column prevents *silent overwrites*. Worked example:

```typescript
// migration: recipes.version integer not null default 1
// service, inside the transaction after SELECT ... FOR UPDATE:
if (input.expectedVersion !== undefined && existing.version !== input.expectedVersion)
  throw new ConflictError("This recipe changed since you loaded it. Reload and try again.");
// the update statement:
.update({ ...columns, version: existing.version + 1, updated_at: trx.fn.now() })
// errorMiddleware: ConflictError -> 409
```

Test (add to `ownership.test.ts`): create as Alice, read `version` (1); `PUT` with `expectedVersion: 1` -> 200 and the response carries `version: 2`; `PUT` again with `expectedVersion: 1` -> 409 and the stored title equals the first update's. Clients that do not send `expectedVersion` keep the old behavior, which lets you roll this out without breaking the form.

Review criterion: the comparison must happen on the locked row inside the transaction; a check before `FOR UPDATE` reintroduces the race the lock closed.

## Review questions with answer guidance

**Why not trust input just because it came from this UI?** A caller can bypass the UI, a saved file can be edited, and older data can have a different shape. Validate at the boundary that owns the operation.

**Why keep the id stable?** It identifies the same domain record across views and edits. Changing it can create duplicates, disconnect child records or make reconciliation impossible.

**What makes the failure test meaningful?** It observes the promised state invariant. For this project, explain exactly why the failing scenario in [server/test/ownership.test.ts](../server/test/ownership.test.ts) would detect the original or a plausible regression.

**What does the test not prove?** A bounded suite does not prove all concurrency, browsers, deployment configurations or unrelated domain behavior. Name the real limitation from this lesson instead of adding a generic disclaimer.

**When should you extract a helper?** When it isolates a coherent responsibility, makes an invariant clearer or enables a meaningful test without duplicating application logic. A pure validator and a shared persistence boundary are common examples, but do not abstract solely to increase the number of files.

## A sample change explanation

“The previous behavior was: Ownership checks and transactions already existed, but the update ownership read happened outside the replacement transaction. Input parsing filtered some invalid child records instead of rejecting them and could throw ordinary TypeErrors for malformed values. I changed the implementation so that: The update locks and checks ownership within the transaction. Nested input is validated without silently dropping invalid children. The model update also scopes by owner. Real HTTP tests deny a signed-in nonowner, and real foreign-key failures prove both create and replacement rollback. The strongest evidence is the regression that exercises the worked fixture and checks authoritative state. A remaining design question is the final stretch exercise.”

Replace that explanation with your own words and actual test results. A strong junior engineer can connect a concrete user problem to code, verification and a clearly stated limit. Completing that explanation independently is the final checkpoint for this course.
