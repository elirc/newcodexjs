# Guided and independent practice

[Course index](README.md) · [Solutions](06-SOLUTIONS-AND-REVIEW.md)

## Exercise 0 — reconstruct the existing behavior

Draw the data shape and trace this fixture without running it:

Activate a nonexistent environment and confirm Local remains active. Concurrently activate Local and Staging: only one ends active for that user. Replacing variables with KEY and spaced KEY returns 400 and preserves BASE_URL. Sending [] explicitly clears the owned environment.

Write one assertion for success and one for a rejected or failed operation. Then read the existing test and compare its observation with yours. Explain why a message alone would or would not prove the invariant.

## Exercise 1 — guided extension

Show an active badge only after the activation request succeeds.

Start by locating the current input, handler and output. Write an acceptance example before editing. Make one small change, run the focused tests, and demonstrate it through the same public UI/API a user would use. Add one meaningful regression if the behavior can break in a way the existing suite would miss.

## Exercise 2 — independent variation

Add a duplicate-key hint while editing variables.

Close the worked-change chapter while implementing. Describe your design in three sentences: the data you will add or reuse, the rule it must preserve, and the observation that proves it. Compare your answer with the solution only after an independent attempt. If you get stuck, request a hint about the next boundary rather than a complete implementation.

## Exercise 3 — failure-focused extension

Force an insert failure halfway through replacement and check the original variables.

Create a failing example in a disposable fixture. Capture the state before the operation and after the failure. Identify what must remain unchanged and what feedback the caller needs. A correct result includes understandable recovery behavior, not just throwing an exception.

## Exercise 4 — stretch design

Add ownership checks to collection/folder/request moves.

Write a short design note before coding. List the current guarantee, the stronger guarantee you want and the new failure modes the change introduces. If this requires a larger architectural change, stop at a concrete proposal and test design until you understand the prerequisite. The earlier exercises should remain understandable and runnable.

## Exercise 5 — teach the codebase

Give a five-minute walkthrough to another learner, or record yourself. Use [server/src/models/environmentModel.ts](../server/src/models/environmentModel.ts) and one test. Explain the application problem, the data model, the call path, one success case, one failure case and the tradeoff. Ask the listener to predict a new input’s result. Their questions reveal which part of your explanation needs work.

## Exercise 6 — review your own change

Inspect the diff as if you were a teammate encountering it for the first time. Remove unrelated edits. Check names, error feedback, preservation of ids/data, and the order of writes. Update the learning note if the actual code differs from the plan. Record what was tested and what remains an assumption.

## Exercise 7 — ownership on collections, folders and requests

Environments are scoped by `user_id` in every query. Collections, folders and saved requests are where a cross-owner reference can slip in: a request moved into someone else's folder, a folder attached to someone else's collection.

1. Read `collectionService.ts` and `collectionModel.ts` and list every write that takes a foreign key from the body (`collection_id`, `folder_id`). For each, write down whether the referenced row is loaded with `user_id = ?`.
2. Add one helper, `assertOwned(trx, table, id, userId)`, that throws `NotFoundError` when the row is missing or foreign, and call it for every foreign key before the write, inside the same transaction as the write.
3. Test: user 1 creates a collection and folder; user 2 tries to create a request in that folder, move their own request into it, and rename the collection; all three are 404 and the rows are unchanged; user 1's same calls succeed.

Acceptance is the test plus one sentence on why the helper runs inside the transaction (a row could be re-parented between the check and the write).

## Completion rubric

Score each item 0 (cannot explain), 1 (can explain with help) or 2 (independent): data model, control flow, validation, persistence/failure behavior, regression test design, and tradeoff explanation. Aim for 2 on the first five before taking the stretch exercise. Revisit a weak area with a changed-input example rather than rereading every page.
