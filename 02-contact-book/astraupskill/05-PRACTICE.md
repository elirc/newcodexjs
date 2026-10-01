# Guided and independent practice

[Course index](README.md) · [Solutions](06-SOLUTIONS-AND-REVIEW.md)

## Exercise 0 — reconstruct the existing behavior

Draw the data shape and trace this fixture without running it:

Import a company "Labs, Inc." and notes containing a newline and the words She said "hello". The stored strings must be intact. In another batch, insert a new email and TemporaryTag, then repeat that email in row two: no contact or TemporaryTag from that batch may remain.

Write one assertion for success and one for a rejected or failed operation. Then read the existing test and compare its observation with yours. Explain why a message alone would or would not prove the invariant.

## Exercise 1 — guided extension

Return a preview of row errors without writing any data.

Start by locating the current input, handler and output. Write an acceptance example before editing. Make one small change, run the focused tests, and demonstrate it through the same public UI/API a user would use. Add one meaningful regression if the behavior can break in a way the existing suite would miss.

## Exercise 2 — independent variation

Define a duplicate-email import policy that supports deliberate updates.

Close the worked-change chapter while implementing. Describe your design in three sentences: the data you will add or reuse, the rule it must preserve, and the observation that proves it. Compare your answer with the solution only after an independent attempt. If you get stuck, request a hint about the next boundary rather than a complete implementation.

## Exercise 3 — failure-focused extension

Add a quoted carriage-return round-trip fixture.

Create a failing example in a disposable fixture. Capture the state before the operation and after the failure. Identify what must remain unchanged and what feedback the caller needs. A correct result includes understandable recovery behavior, not just throwing an exception.

## Exercise 4 — stretch design

Investigate CSV spreadsheet-formula handling for a separate export policy.

Write a short design note before coding. List the current guarantee, the stronger guarantee you want and the new failure modes the change introduces. If this requires a larger architectural change, stop at a concrete proposal and test design until you understand the prerequisite. The earlier exercises should remain understandable and runnable.

## Exercise 5 — teach the codebase

Give a five-minute walkthrough to another learner, or record yourself. Use [server/src/utils/csv.js](../server/src/utils/csv.js) and one test. Explain the application problem, the data model, the call path, one success case, one failure case and the tradeoff. Ask the listener to predict a new input’s result. Their questions reveal which part of your explanation needs work.

## Exercise 6 — review your own change

Inspect the diff as if you were a teammate encountering it for the first time. Remove unrelated edits. Check names, error feedback, preservation of ids/data, and the order of writes. Update the learning note if the actual code differs from the plan. Record what was tested and what remains an assumption.

## Exercise 8 — batch the import without losing the rollback

Rewrite `importContactBatch` to use three statements instead of ~10 per contact, inside the same `db.transaction`:

1. `trx("contacts").insert(rows).returning("*")` for all contacts at once.
2. One `trx("tags").insert(distinctNames.map(name => ({ name }))).onConflict("name").ignore()`, then one `SELECT` of all those tags.
3. One `trx("contact_tags").insert(junctions)` built from the returned ids.

Acceptance: the existing test "a late database uniqueness failure rolls back contacts, new tags and junctions" must still pass unchanged, and a new test must import 200 generated rows and assert the count. Measure the wall time before and after with `console.time`.

## Exercise 7 — ownership and authorization

Contacts have no owner. Add one and scope the import.

1. Migration: `owner text NOT NULL DEFAULT 'anonymous'` on `contacts`.
2. Middleware: read `X-Actor`; blank on writes -> 401.
3. `importContacts(csv, actor)` stamps `owner` on every parsed row before `importContactBatch`; list, get, update and delete carry `WHERE owner = ?`.
3. Test: `ana` imports two contacts; `ben` lists (empty), gets one by id (404), deletes it (404, row still there); `ana` sees both.

Acceptance is the test plus one sentence on why the import stamps the owner in the service (before the transaction) rather than trusting a column in the CSV.

## Completion rubric

Score each item 0 (cannot explain), 1 (can explain with help) or 2 (independent): data model, control flow, validation, persistence/failure behavior, regression test design, and tradeoff explanation. Aim for 2 on the first five before taking the stretch exercise. Revisit a weak area with a changed-input example rather than rereading every page.
