# Guided and independent practice

[Course index](README.md) · [Solutions](06-SOLUTIONS-AND-REVIEW.md)

## Exercise 0 — reconstruct the existing behavior

Draw the data shape and trace this fixture without running it:

For February 2024 use Food 10.10 on Feb 1, Food 20.20 on Feb 29 and Travel 4.70 on Feb 15. Put 99 on Jan 31 and 777 on Mar 1. February total is 35.00 across three expenses; Food is 30.30 and Travel is 4.70. Adjacent-month rows must not leak in.

Write one assertion for success and one for a rejected or failed operation. Then read the existing test and compare its observation with yours. Explain why a message alone would or would not prove the invariant.

## Exercise 1 — guided extension

Add a year-to-date summary with an explicit end boundary.

Start by locating the current input, handler and output. Write an acceptance example before editing. Make one small change, run the focused tests, and demonstrate it through the same public UI/API a user would use. Add one meaningful regression if the behavior can break in a way the existing suite would miss.

## Exercise 2 — independent variation

Make an empty category appear with zero spending using a LEFT JOIN.

Close the worked-change chapter while implementing. Describe your design in three sentences: the data you will add or reuse, the rule it must preserve, and the observation that proves it. Compare your answer with the solution only after an independent attempt. If you get stuck, request a hint about the next boundary rather than a complete implementation.

## Exercise 3 — failure-focused extension

Test a week that crosses December into January.

Create a failing example in a disposable fixture. Capture the state before the operation and after the failure. Identify what must remain unchanged and what feedback the caller needs. A correct result includes understandable recovery behavior, not just throwing an exception.

## Exercise 4 — stretch design

Return report amounts as integer cents without changing displayed values.

Write a short design note before coding. List the current guarantee, the stronger guarantee you want and the new failure modes the change introduces. If this requires a larger architectural change, stop at a concrete proposal and test design until you understand the prerequisite. The earlier exercises should remain understandable and runnable.

## Exercise 5 — teach the codebase

Give a five-minute walkthrough to another learner, or record yourself. Use [server/src/models/expenseModel.js](../server/src/models/expenseModel.js) and one test. Explain the application problem, the data model, the call path, one success case, one failure case and the tradeoff. Ask the listener to predict a new input’s result. Their questions reveal which part of your explanation needs work.

## Exercise 6 — review your own change

Inspect the diff as if you were a teammate encountering it for the first time. Remove unrelated edits. Check names, error feedback, preservation of ids/data, and the order of writes. Update the learning note if the actual code differs from the plan. Record what was tested and what remains an assumption.

## Exercise 7 — half-open or inclusive: make the two report paths agree

`monthlySummary('2024-02')` computes its window from the month, while `byCategory({ start_date, end_date })` takes the range from the caller. Chapter 2 mentions that one is half-open and the other inclusive; prove it and fix it.

1. Seed an expense on `2024-03-01`. Predict what `byCategory({ start_date: '2024-02-01', end_date: '2024-03-01' })` returns for February if `end_date` is inclusive (it counts March 1) and if it is exclusive (it does not).
2. Write the acceptance test first: the February total from `monthlySummary('2024-02')` must equal the sum of `byCategory(...)` totals for the same February, and March 1 must not be double-counted when the next range starts there.
3. Pick one convention (half-open `[start, end)` is the usual choice), change `expenseQuery` in `server/src/models/expenseModel.js` accordingly, and update the message in `02-CONCEPTS.md`.

## Completion rubric

Score each item 0 (cannot explain), 1 (can explain with help) or 2 (independent): data model, control flow, validation, persistence/failure behavior, regression test design, and tradeoff explanation. Aim for 2 on the first five before taking the stretch exercise. Revisit a weak area with a changed-input example rather than rereading every page.
