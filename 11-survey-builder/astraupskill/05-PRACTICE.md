# Guided and independent practice

[Course index](README.md) · [Solutions](06-SOLUTIONS-AND-REVIEW.md)

## Exercise 0 — reconstruct the existing behavior

Draw the data shape and trace this fixture without running it:

A required multi-choice question accepts JavaScript once even if it appears twice in the submitted array. Unknown, object and empty answers return 400 and create no response. Two submissions to max_responses=1 produce one 201 and one 400. Future, expired and closed surveys reject submissions.

Write one assertion for success and one for a rejected or failed operation. Then read the existing test and compare its observation with yours. Explain why a message alone would or would not prove the invariant.

## Exercise 1 — guided extension

Display required-answer errors next to their questions.

Start by locating the current input, handler and output. Write an acceptance example before editing. Make one small change, run the focused tests, and demonstrate it through the same public UI/API a user would use. Add one meaningful regression if the behavior can break in a way the existing suite would miss.

## Exercise 2 — independent variation

Add an answer-preview table before submission.

Close the worked-change chapter while implementing. Describe your design in three sentences: the data you will add or reuse, the rule it must preserve, and the observation that proves it. Compare your answer with the solution only after an independent attempt. If you get stuck, request a hint about the next boundary rather than a complete implementation.

## Exercise 3 — failure-focused extension

Force the second answer insert to fail and verify the whole response rolls back.

Create a failing example in a disposable fixture. Capture the state before the operation and after the failure. Identify what must remain unchanged and what feedback the caller needs. A correct result includes understandable recovery behavior, not just throwing an exception.

## Exercise 4 — stretch design

Define a policy for editing a question after responses exist.

Write a short design note before coding. List the current guarantee, the stronger guarantee you want and the new failure modes the change introduces. If this requires a larger architectural change, stop at a concrete proposal and test design until you understand the prerequisite. The earlier exercises should remain understandable and runnable.

## Exercise 5 — teach the codebase

Give a five-minute walkthrough to another learner, or record yourself. Use [server/src/services/surveyService.ts](../server/src/services/surveyService.ts) and one test. Explain the application problem, the data model, the call path, one success case, one failure case and the tradeoff. Ask the listener to predict a new input’s result. Their questions reveal which part of your explanation needs work.

## Exercise 6 — review your own change

Inspect the diff as if you were a teammate encountering it for the first time. Remove unrelated edits. Check names, error feedback, preservation of ids/data, and the order of writes. Update the learning note if the actual code differs from the plan. Record what was tested and what remains an assumption.

## Exercise 7 — ownership and authorization on the owner side

Respondents are anonymous by design, but survey owners are not: every `/api/surveys/:id` route trusts the demo `x-user-id` header and `getSurvey(surveyId, userId)` is the only thing standing between two owners.

1. Read `getSurvey` in `services/surveyService.ts` and write down which routes call it and which write routes reach `surveyModel` without it (questions, reorder, delete).
2. Make every question route (`POST /surveys/:id/questions`, `PUT`/`DELETE /questions/:questionId`, `PUT /surveys/:id/questions/reorder`) verify that the survey belongs to `userId` before writing, using one helper `assertOwner(surveyId, userId)` that throws `NotFoundError` (deliberately not 403: an owner should not learn that another owner's survey id exists).
3. Test: user 1 creates a survey with a question; user 2 attempts to update, reorder and delete that question and to add a new one; every call is 404 and the rows are unchanged; user 1's same calls succeed.

Acceptance is the test in step 3 plus one sentence in `02-CONCEPTS.md` on why the public respondent path must never use `x-user-id`.

## Completion rubric

Score each item 0 (cannot explain), 1 (can explain with help) or 2 (independent): data model, control flow, validation, persistence/failure behavior, regression test design, and tradeoff explanation. Aim for 2 on the first five before taking the stretch exercise. Revisit a weak area with a changed-input example rather than rereading every page.
