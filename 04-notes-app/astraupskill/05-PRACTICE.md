# Guided and independent practice

[Course index](README.md) · [Solutions](06-SOLUTIONS-AND-REVIEW.md)

## Exercise 0 — reconstruct the existing behavior

Draw the data shape and trace this fixture without running it:

Running notes matches search run through stemming. A note whose folder is HiddenKeyword does not match that content query. Invalid tags are rejected before writing. Updating only body retains title/id and makes its new words searchable.

Write one assertion for success and one for a rejected or failed operation. Then read the existing test and compare its observation with yours. Explain why a message alone would or would not prove the invariant.

## Exercise 1 — guided extension

Add a vector/index migration.

Start by locating the current input, handler and output. Write an acceptance example before editing. Make one small change, run the focused tests, and demonstrate it through the same public UI/API a user would use. Add one meaningful regression if the behavior can break in a way the existing suite would miss.

## Exercise 2 — independent variation

Rank by relevance with stable ties: add `ts_rank(to_tsvector('english', ...), plainto_tsquery('english', ?))` as a selected column and order by it descending, then by `created_at DESC, id DESC`. Prove it changes result order: insert one note whose title contains `postgres index` twice and another that mentions `index` once in the body, search `postgres index`, and assert the first note comes first even though it was created earlier.

Close the worked-change chapter while implementing. Describe your design in three sentences: the data you will add or reuse, the rule it must preserve, and the observation that proves it. Compare your answer with the solution only after an independent attempt. If you get stuck, request a hint about the next boundary rather than a complete implementation.

## Exercise 3 — failure-focused extension

Test slow-old versus fast-new responses.

Create a failing example in a disposable fixture. Capture the state before the operation and after the failure. Identify what must remain unchanged and what feedback the caller needs. A correct result includes understandable recovery behavior, not just throwing an exception.

## Exercise 4 — stretch design

Design multilingual search: add a `language` column (per note or per workspace, decide and justify), build the vector with `to_tsvector(language::regconfig, ...)`, and show what happens to stemming by inserting `running` and searching `run` under `english` and then under `simple` (no stemming). The expression index from exercise 1 must include the language or it will not be used.

Write a short design note before coding. List the current guarantee, the stronger guarantee you want and the new failure modes the change introduces. If this requires a larger architectural change, stop at a concrete proposal and test design until you understand the prerequisite. The earlier exercises should remain understandable and runnable.

## Exercise 5 — teach the codebase

Give a five-minute walkthrough to another learner, or record yourself. Use [server/src/models/model.js](../server/src/models/model.js) and one test. Explain the application problem, the data model, the call path, one success case, one failure case and the tradeoff. Ask the listener to predict a new input’s result. Their questions reveal which part of your explanation needs work.

## Exercise 6 — review your own change

Inspect the diff as if you were a teammate encountering it for the first time. Remove unrelated edits. Check names, error feedback, preservation of ids/data, and the order of writes. Update the learning note if the actual code differs from the plan. Record what was tested and what remains an assumption.

## Exercise 7 — ownership and authorization

Notes have no owner. Add one end to end.

1. Migration `003_owner.js`: `owner text NOT NULL DEFAULT 'anonymous'` on `notes`.
2. Middleware in `server/src/app.js`: read `X-Actor`, attach `req.actor`; blank on `POST`/`PUT`/`DELETE` -> 401.
3. `service.list` adds `owner: req.actor` to the filters and `listRecords` applies it in the `WHERE`; `get`, `update` and `remove` load with `{ id, owner }` and answer 404 for a foreign note.
4. Test: `ana` creates two notes; `ben` lists (empty), gets one (404), edits (404, unchanged); `ana` sees both.

## Completion rubric

Score each item 0 (cannot explain), 1 (can explain with help) or 2 (independent): data model, control flow, validation, persistence/failure behavior, regression test design, and tradeoff explanation. Aim for 2 on the first five before taking the stretch exercise. Revisit a weak area with a changed-input example rather than rereading every page.
