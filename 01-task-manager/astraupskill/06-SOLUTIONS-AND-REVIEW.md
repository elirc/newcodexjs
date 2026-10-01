# Solutions and engineering review

[Course index](README.md) · [Practice prompts](05-PRACTICE.md)

Attempt each exercise before using these notes. These are solution approaches and review criteria, not claims that every extension has been implemented. The actual completed behavior is described in the worked-change chapter.

## Existing implementation

The API rejects unsafe ids and titles longer than the database column. An unchanged existing due date remains editable; new or changed due dates still follow the future-date rule. Tests call real HTTP routes and inspect PostgreSQL rows, including completion timestamps and deletion.

The key model is: A SQL task includes id, title, description, priority, status, due_date and completion timestamps. The database id is a positive integer. A partial update distinguishes an omitted field from a supplied null or value.

The worked fixture should behave as follows: Create a high-priority task due 2099-01-01, filter for high priority, mark it done, reopen it and delete it. Separately seed a task due 2020-01-01: editing its title with that same due date succeeds, but changing it to another past date fails.

## Extension solutions

### Exercise 1

**Prompt:** Add a task title search filter with bound SQL parameters.

**Approach:** Validate a bounded search string in the service and use Knex where/whereILike binding rather than interpolating raw SQL. Test a quote and a percent sign according to the search policy.

**Review:** the filter must be a bound parameter (`whereILike("title", `%${q}%`)` or a parameterized `where`), never string-concatenated into SQL; your test sends a title containing `%` and `'` and asserts the query still matches exactly the intended rows.

### Exercise 2

**Prompt:** Test clearing an optional due date without changing the title.

**Approach:** Submit due_date:null and assert the stored column becomes null while omitted fields retain their values.

**Review:** the test must send `{ due_date: null }` (or `""` if that is the contract) and assert the row's `due_date` is `NULL` while `title` is unchanged, and must also show that omitting `due_date` leaves the existing value alone; name the branch of `normalizeDueDate` that handles each.

### Exercise 3

**Prompt:** Add optimistic concurrency for two users editing the same task.

**Approach:** Add a version field, update only where id and expected version match, and return a conflict when no row matches. Test two updates based on the same version.

**Review:** add a `version` column, send it back on `PUT`, update with `WHERE id = ? AND version = ?` and answer 409 on zero rows; the test issues two sequential `PUT`s with the same stale version and asserts 200 then 409 with the row equal to the first result.

### Exercise 4

**Prompt:** Trace a server validation message into the client form and improve its wording.

**Approach:** Follow apiClient → useTasks → form/page error rendering. Preserve a useful domain message and avoid exposing database internals.

**Review:** trace one message from `ValidationError` in the service, through the error middleware envelope, through `apiClient.js`, into the form; propose a wording change and show the same test string updated in `tasks.test.cjs` so the contract stays pinned.

### Exercise 7 — ownership and authorization

Reference (the check lives in the service, before the model writes):

```js
async function updateTask(id, payload, actor) {
  const existing = await taskModel.findTaskById(parseTaskId(id));
  if (!existing) throw new NotFoundError('Task not found.');
  if (existing.owner !== actor) throw new ForbiddenError('Only the owner can edit this task.');
  return taskModel.updateTask(existing.id, buildUpdatePayload(payload, existing));
}
```

Reference test skeleton: create as `ana`; `PUT` as `ben` -> 403 and `db("tasks").where({ id }).first()` unchanged; `DELETE` as `ben` -> 403; `PUT` as `ana` -> 200; `PUT` with no header -> 401.

Review: explain why the read-then-write is safe enough here (one `UPDATE`, owner never changes) and what you would add if owners could be reassigned concurrently (`WHERE id = ? AND owner = ?` in the update).

## Review questions with answer guidance

**Why not trust input just because it came from this UI?** A caller can bypass the UI, a saved file can be edited, and older data can have a different shape. Validate at the boundary that owns the operation.

**Why keep the id stable?** It identifies the same domain record across views and edits. Changing it can create duplicates, disconnect child records or make reconciliation impossible.

**What makes the failure test meaningful?** It observes the promised state invariant. For this project, explain exactly why the failing scenario in [server/test/tasks.test.cjs](../server/test/tasks.test.cjs) would detect the original or a plausible regression.

**What does the test not prove?** A bounded suite does not prove all concurrency, browsers, deployment configurations or unrelated domain behavior. Name the real limitation from this lesson instead of adding a generic disclaimer.

**When should you extract a helper?** When it isolates a coherent responsibility, makes an invariant clearer or enables a meaningful test without duplicating application logic. A pure validator and a shared persistence boundary are common examples, but do not abstract solely to increase the number of files.

## A sample change explanation

“The previous behavior was: The project already had CRUD routes and validation. It lacked executable regression coverage for the complete path, allowed unsafe integer ids and overlong titles to reach deeper layers, and could reject editing an overdue task when its unchanged date was resubmitted. I changed the implementation so that: The API rejects unsafe ids and titles longer than the database column. An unchanged existing due date remains editable; new or changed due dates still follow the future-date rule. Tests call real HTTP routes and inspect PostgreSQL rows, including completion timestamps and deletion. The strongest evidence is the regression that exercises the worked fixture and checks authoritative state. A remaining design question is the final stretch exercise.”

Replace that explanation with your own words and actual test results. A strong junior engineer can connect a concrete user problem to code, verification and a clearly stated limit. Completing that explanation independently is the final checkpoint for this course.
