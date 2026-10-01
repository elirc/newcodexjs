# Solutions and engineering review

[Course index](README.md) · [Practice prompts](05-PRACTICE.md)

Attempt each exercise before using these notes. These are solution approaches and review criteria, not claims that every extension has been implemented. The actual completed behavior is described in the worked-change chapter.

## Existing implementation

Archive stores the previous status in an additive migration, restore returns to that status, and repeats are no-ops. Ordinary and bulk status changes keep archive flags consistent. Bulk IDs are deduplicated; all targets are locked and checked before any change. Audit rows contain real before/after records. List refreshes ignore stale responses and use the current filters after a mutation; failed saves retain the draft and show an error.

The key model is: tasks belong to the grouping reference workspace_id. Records have title, owner, priority, status, metadata, due_at, risk_level, version, archived_at and deleted_at. Status vocabulary: todo, in_progress, blocked, done, archived. The new nullable status_before_archive column remembers the earlier state. Comments, activity_events and audit_log reference records.

The worked fixture should behave as follows: Create a record in in_progress, archive it twice and restore it twice. Only the actual transitions add history, and restore returns in_progress. Bulk-update [existingId,999999]: return 404 and leave the existing row unchanged. A duplicated valid ID changes once and audit.before/status differs from audit.after/status.

## Extension solutions

### Exercise 1

**Prompt:** Display the previous status while a record is archived.

**Approach:** Read status_before_archive and label a missing legacy value honestly; do not infer an earlier state from the current badge.

**Review:** the badge must read `status_before_archive` from the record and render an explicit "unknown" for a legacy row where it is `null`; a server test should archive a record with status `blocked` and assert the field, and a client test should render both a known and a null value.

### Exercise 2

**Prompt:** Preview the distinct IDs affected by a bulk action.

**Approach:** Deduplicate selected IDs and show the exact target count. Keep server validation for removed or stale IDs.

**Review:** the preview must show the count of *distinct* ids (`new Set(selectedIds).size`) and must not disable the server-side 404 for stale ids; a server test should send `[a, a, missing]` and assert 404 with nothing changed, and `[a, a]` and assert one row in the response.

### Exercise 3

**Prompt:** Inject an audit-write failure and verify all bulk changes roll back.

**Approach:** Install a failure trigger in a test schema, submit multiple changes and compare every status, version and audit count with its starting state.

**Review:** install a `BEFORE INSERT` trigger on `audit_log` in the test schema, submit a bulk status change for two records, assert 500, then assert both records' `status` and `version` and the audit count equal their pre-request values; name the statement that had already run for the first record when the second failed.

### Exercise 4

**Prompt:** Add optimistic concurrency and genuine authorization.

**Approach:** Require an expected version and verified session identity. Scope grouping membership in server predicates; a demo role header or foreign key alone is insufficient.

**Review:** the design must (a) add `expectedVersion` to the edit payload and update with `WHERE id = ? AND version = ?`, returning 409 when zero rows match; (b) replace the demo role header with a verified session and scope every query by team membership in SQL; and (c) show one test where a stale edit is rejected and the stored row is the newer one.

### Exercise 7 — ownership and authorization beyond the role header

Reference query (inside the bulk transaction, after locking the rows):

```typescript
const allowed = await trx(table)
  .whereIn("id", ids)
  .whereIn("team_id", trx("team_members").select("team_id").where({ actor: context.actor, role: "operator" }))
  .count("* as n").first();
if (Number(allowed.n) !== ids.length) throw new NotFoundError("One or more records were not found; no statuses changed.");
```

Reference test skeleton: insert `team_members` rows for actor `ana` (team 1 operator) and `ben` (team 2 operator); create record `x` in team 1 and `y` in team 2; `POST /bulk/status` as `ana` with `[x, y]` -> 404 and both statuses unchanged; with `[x]` -> 200.

Review: the membership check reuses the "all or nothing" shape of the existing missing-id check, which is why the same error message is appropriate; explain what would go wrong if the check ran before the row lock.

## Review questions with answer guidance

**Why not trust input just because it came from this UI?** A caller can bypass the UI, a saved file can be edited, and older data can have a different shape. Validate at the boundary that owns the operation.

**Why keep the id stable?** It identifies the same domain record across views and edits. Changing it can create duplicates, disconnect child records or make reconciliation impossible.

**What makes the failure test meaningful?** It observes the promised state invariant. For this project, explain exactly why the failing scenario in [test/crud.test.ts](../test/crud.test.ts) would detect the original or a plausible regression.

**What does the test not prove?** A bounded suite does not prove all concurrency, browsers, deployment configurations or unrelated domain behavior. Name the real limitation from this lesson instead of adding a generic disclaimer.

**When should you extract a helper?** When it isolates a coherent responsibility, makes an invariant clearer or enables a meaningful test without duplicating application logic. A pure validator and a shared persistence boundary are common examples, but do not abstract solely to increase the number of files.

## A sample change explanation

“The previous behavior was: Restore always assigned active, even when that was not a valid workflow state. Bulk updates could silently ignore missing IDs and audit entries lacked the actual previous record. I changed the implementation so that: Archive stores the previous status in an additive migration, restore returns to that status, and repeats are no-ops. Ordinary and bulk status changes keep archive flags consistent. Bulk IDs are deduplicated; all targets are locked and checked before any change. Audit rows contain real before/after records. List refreshes ignore stale responses and use the current filters after a mutation; failed saves retain the draft and show an error. The strongest evidence is the regression that exercises the worked fixture and checks authoritative state. A remaining design question is the final stretch exercise.”

Replace that explanation with your own words and actual test results. A strong junior engineer can connect a concrete user problem to code, verification and a clearly stated limit. Completing that explanation independently is the final checkpoint for this course.
