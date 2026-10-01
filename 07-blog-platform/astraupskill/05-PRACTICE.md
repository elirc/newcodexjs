# Guided and independent practice

[Course index](README.md) · [Solutions](06-SOLUTIONS-AND-REVIEW.md)

## Exercise 0 — reconstruct the existing behavior

Draw the data shape and trace this fixture without running it:

POST this synthetic input: {"title": "Post title", "body": "Post body", "slug": "post-title", "status": "draft", "tags": ["blog"]}. Then PUT only {"title":"Revised lesson"} to its ID and check the other fields remain. Tags ["API"," api "] produce one logical tag. Reject a numeric title and verify the row is unchanged; delete it and check a second delete returns 404.

Write one assertion for success and one for a rejected or failed operation. Then read the existing test and compare its observation with yours. Explain why a message alone would or would not prove the invariant.

## Exercise 1 — guided extension

Add a typed filter for slug while preserving search.

Start by locating the current input, handler and output. Write an acceptance example before editing. Make one small change, run the focused tests, and demonstrate it through the same public UI/API a user would use. Add one meaningful regression if the behavior can break in a way the existing suite would miss.

## Exercise 2 — independent variation

Show a dirty-form indicator and confirm before discarding changes.

Close the worked-change chapter while implementing. Describe your design in three sentences: the data you will add or reuse, the rule it must preserve, and the observation that proves it. Compare your answer with the solution only after an independent attempt. If you get stuck, request a hint about the next boundary rather than a complete implementation.

## Exercise 3 — failure-focused extension

Add a meaningful browser test for a slow old search response.

Create a failing example in a disposable fixture. Capture the state before the operation and after the failure. Identify what must remain unchanged and what feedback the caller needs. A correct result includes understandable recovery behavior, not just throwing an exception.

## Exercise 4 — stretch design

Add optimistic concurrency for two editors.

Write a short design note before coding. List the current guarantee, the stronger guarantee you want and the new failure modes the change introduces. If this requires a larger architectural change, stop at a concrete proposal and test design until you understand the prerequisite. The earlier exercises should remain understandable and runnable.

## Exercise 5 — teach the codebase

Give a five-minute walkthrough to another learner, or record yourself. Use [server/src/services/service.ts](../server/src/services/service.ts) and one test. Explain the application problem, the data model, the call path, one success case, one failure case and the tradeoff. Ask the listener to predict a new input’s result. Their questions reveal which part of your explanation needs work.

## Exercise 6 — review your own change

Inspect the diff as if you were a teammate encountering it for the first time. Remove unrelated edits. Check names, error feedback, preservation of ids/data, and the order of writes. Update the learning note if the actual code differs from the plan. Record what was tested and what remains an assumption.

## Exercise 7 — ownership and authorization

Posts have no author. Add one and enforce it end to end.

1. Migration `002_author.ts`: `author text NOT NULL DEFAULT 'anonymous'` on `posts`.
2. Middleware in `server/src/app.ts`: read `X-Actor`, attach `req.actor`; blank on `POST`/`PUT`/`DELETE` -> 401 through a new `UnauthorizedError` in `utils/errors.ts` (statusCode 401).
3. `service.create` sets `author` from the actor (ignore any body `author`); `service.update` and `service.remove` load the row first and throw `ForbiddenError` (403) when `row.author !== actor`. Keep the `NotFoundError` for a missing id.
4. `client/src/services/api.ts`: send the header from a small "writing as" input.

Acceptance, written first: cross-author `PUT` is 403 and the row deep-equals the original; cross-author `DELETE` is 403 and the row still exists; own `PUT` is 200; missing header is 401; `GET` needs no header. Extend `request()` in `test/database.ts` with a headers argument.

## Completion rubric

Score each item 0 (cannot explain), 1 (can explain with help) or 2 (independent): data model, control flow, validation, persistence/failure behavior, regression test design, and tradeoff explanation. Aim for 2 on the first five before taking the stretch exercise. Revisit a weak area with a changed-input example rather than rereading every page.
