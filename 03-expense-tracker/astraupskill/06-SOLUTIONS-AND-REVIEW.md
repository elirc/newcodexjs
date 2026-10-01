# Solutions and engineering review

[Course index](README.md) · [Practice prompts](05-PRACTICE.md)

Attempt each exercise before using these notes. These are solution approaches and review criteria, not claims that every extension has been implemented. The actual completed behavior is described in the worked-change chapter.

## Existing implementation

The category query clears the base projection before selecting category fields, SUM and COUNT. Report inputs reject malformed months, impossible dates and reversed ranges. The test fixture proves monthly, daily and category results agree at leap-day and month boundaries.

The key model is: Each expense belongs to one category and has a date and decimal amount. Monthly windows are half-open: first day inclusive, next month’s first day exclusive. Category range filters currently include both supplied start_date and end_date.

The worked fixture should behave as follows: For February 2024 use Food 10.10 on Feb 1, Food 20.20 on Feb 29 and Travel 4.70 on Feb 15. Put 99 on Jan 31 and 777 on Mar 1. February total is 35.00 across three expenses; Food is 30.30 and Travel is 4.70. Adjacent-month rows must not leak in.

## Extension solutions

### Exercise 1

**Prompt:** Add a year-to-date summary with an explicit end boundary.

**Approach:** Define inclusive/exclusive semantics first, then seed rows just before, inside and at the excluded boundary. Use SQL date operations rather than a fixed day count.

**Review:** the year-to-date window must be `[Jan 1, today)` computed in one place (the service) with an explicit exclusive end, and the test must seed a row dated today and one dated tomorrow and assert only today's is included.

### Exercise 2

**Prompt:** Make an empty category appear with zero spending using a LEFT JOIN.

**Approach:** Start from categories and place expense date predicates in the join condition; a WHERE filter on the optional expense row can accidentally turn the left join into an inner join.

**Review:** the `LEFT JOIN` version must return every category with `COALESCE(SUM(...), 0)` and `COUNT(expenses.id)` (not `COUNT(*)`, which would count the null row as 1); the test asserts `total: 0, count: 0` for the empty category and unchanged totals for the others.

### Exercise 3

**Prompt:** Test a week that crosses December into January.

**Approach:** Use fixed dates spanning the year boundary and assert exactly seven calendar dates are eligible under the half-open interval.

**Review:** the week test must seed December 30, December 31 and January 1 and assert the week total crosses the year boundary correctly; state whether weeks start on Monday or Sunday in the query and pin it in the test.

### Exercise 4

**Prompt:** Return report amounts as integer cents without changing displayed values.

**Approach:** Convert at a clearly documented boundary, avoid repeatedly rounding intermediate values, and update API types and chart formatting together.

**Review:** the cents solution must keep the `numeric` sum exact in SQL (`ROUND(SUM(amount) * 100)::bigint`), keep the displayed `total` unchanged, and remove every `Math.round` from the reconciliation test; show the test diff.

### Exercise 7 — half-open or inclusive: make the two report paths agree

Reference acceptance test:

```js
test('monthly summary and category ranges agree on February', async () => {
  const summary = await service.monthlySummary('2024-02');
  const cats = await service.byCategory({ start_date: '2024-02-01', end_date: '2024-03-01' });
  const catTotal = cats.reduce((sum, c) => sum + Math.round(c.total * 100), 0);
  assert.equal(catTotal, Math.round(summary.total * 100)); // 3500 cents with the seeded data
});
```

With inclusive `end_date` this fails by 777.00 (the March 1 row). The fix is `where('expense_date', '<', filters.end_date)` in `expenseQuery` and a note in the API docs that `end_date` is exclusive.

Review: a range convention is an API contract; the test is what keeps the two report paths from drifting apart again.

### Exercise 4 — worked solution: integer cents from SQL

Change the aggregate so the database returns exact cents and the serializer formats them:

```js
// server/src/models/expenseModel.js (byCategory, dailyTotals, monthlySummary)
db.raw("ROUND(SUM(expenses.amount) * 100)::bigint as total_cents")
// serializer
total: Number(row.total_cents) / 100, totalCents: Number(row.total_cents)
```

`numeric` stays exact inside PostgreSQL; the `::float` cast was the only lossy step. With `total_cents` the test can drop `Math.round(x.total * 100)` and compare integers directly. Displayed values do not change because `total` is still returned. Review criterion: the reconciliation test in `reports.test.cjs` must compare `total_cents` sums across monthly, daily and category reports without any rounding in the test.

## Review questions with answer guidance

**Why not trust input just because it came from this UI?** A caller can bypass the UI, a saved file can be edited, and older data can have a different shape. Validate at the boundary that owns the operation.

**Why keep the id stable?** It identifies the same domain record across views and edits. Changing it can create duplicates, disconnect child records or make reconciliation impossible.

**What makes the failure test meaningful?** It observes the promised state invariant. For this project, explain exactly why the failing scenario in [server/test/reports.test.cjs](../server/test/reports.test.cjs) would detect the original or a plausible regression.

**What does the test not prove?** A bounded suite does not prove all concurrency, browsers, deployment configurations or unrelated domain behavior. Name the real limitation from this lesson instead of adding a generic disclaimer.

**When should you extract a helper?** When it isolates a coherent responsibility, makes an invariant clearer or enables a meaningful test without duplicating application logic. A pure validator and a shared persistence boundary are common examples, but do not abstract solely to increase the number of files.

## A sample change explanation

“The previous behavior was: The category report reused a base query that selected expenses.* and then added GROUP BY categories.id. PostgreSQL cannot choose an arbitrary expense row for each category, so that report could fail. Date filters and amount edge cases also needed validation. I changed the implementation so that: The category query clears the base projection before selecting category fields, SUM and COUNT. Report inputs reject malformed months, impossible dates and reversed ranges. The test fixture proves monthly, daily and category results agree at leap-day and month boundaries. The strongest evidence is the regression that exercises the worked fixture and checks authoritative state. A remaining design question is the final stretch exercise.”

Replace that explanation with your own words and actual test results. A strong junior engineer can connect a concrete user problem to code, verification and a clearly stated limit. Completing that explanation independently is the final checkpoint for this course.
