# Worked implementation and examples

[Course index](README.md)

## Before and after

**Before:** The category report reused a base query that selected expenses.* and then added GROUP BY categories.id. PostgreSQL cannot choose an arbitrary expense row for each category, so that report could fail. Date filters and amount edge cases also needed validation.

**After:** The category query clears the base projection before selecting category fields, SUM and COUNT. Report inputs reject malformed months, impossible dates and reversed ranges. The test fixture proves monthly, daily and category results agree at leap-day and month boundaries.

## Predict this example

For February 2024 use Food 10.10 on Feb 1, Food 20.20 on Feb 29 and Travel 4.70 on Feb 15. Put 99 on Jan 31 and 777 on Mar 1. February total is 35.00 across three expenses; Food is 30.30 and Travel is 4.70. Adjacent-month rows must not leak in.

Before running anything, write the exact expected stored values and visible response. Include ids or record counts where they matter. Then run the focused tests and reproduce the matching UI/API action. Do not settle for seeing a success message: inspect the authoritative stored result as well.

## Actual implementation excerpt

The excerpt below comes from [server/src/models/expenseModel.js](../server/src/models/expenseModel.js) near line 166. It is a teaching snapshot; the linked source is authoritative if you later edit the project. Read surrounding code for callers and setup.

```javascript
async function byCategory(filters) {
  return expenseQuery(filters)
    .clearSelect()
    .groupBy("categories.id")
    .select("categories.name", "categories.color", db.raw("SUM(expenses.amount)::float as total"), db.raw("COUNT(*)::int as count"))
    .orderBy("total", "desc");
}

/**
 * Groups spending by day in a month.
 * @param {string} month YYYY-MM.
 * @returns {Promise<Array<object>>}
 */
```

## How to reason through the code

1. Identify the inputs. Distinguish data supplied by a caller from state read from storage or a trusted context.
2. Find the guard clauses. For each early return or thrown error, describe which invariant it protects and whether anything has already been written.
3. Find the candidate state or query. Explain whether it mutates an existing object or constructs a replacement.
4. Locate the persistence operation. For asynchronous code, follow the promise through success and rejection; for transactions, check that all related writes use the same transaction object.
5. Find the output or state publication. Ask what a repeated invocation would do after the first invocation succeeds.

Use this project-specific reasoning as your guide:

A grouped query changes the meaning of a row. Before grouping, a row represents an expense. After grouping by category, it represents a category summary. Raw expense fields no longer have one well-defined value, which is why clearing the inherited SELECT list is necessary. A hand-calculated fixture is a stronger oracle than comparing two functions that share the same bug. The leap-day case makes the time boundary concrete; using a fixed 30-day month would be wrong. Half-open ranges compose cleanly because a boundary date belongs to exactly one month. PostgreSQL decimal columns preserve decimal arithmetic during aggregation, while the API currently casts results to floating-point numbers; tests compare currency totals carefully, and a future money-model exercise can return integer cents or decimal strings. Empty datasets must produce stable zero totals rather than null values that confuse the UI.

## Three variations to work through

**Normal variation — a non-leap February 29.** `parseExpense({ amount: 5, description: 'x', category_id: <food>, expense_date: '2023-02-29' })`. Predict: `validDate` throws (2023 is not a leap year) and nothing is written; then `'2024-02-29'` is accepted (the seeded leap-day row exists for exactly this reason).

**Invalid variation — the boundary instant.** Seed an expense on `2024-03-01`, then call `monthlySummary('2024-02')`: predict it is excluded. Now call `byCategory({ start_date: '2024-02-01', end_date: '2024-03-01' })`: predict whether the March 1 row is included, then check `expenseQuery` to see which comparison operator decides it (exercise 7).

**Boundary variation — an empty category.** Create a category with no expenses and call `byCategory` for February. Predict whether it appears at all (it does not: the query is an inner join grouped by category) and what exercise 2's `LEFT JOIN` version must return for it (`total: 0`, `count: 0`, never `null`).

## Executable examples

These are the actual regression tests in [server/test/reports.test.cjs](../server/test/reports.test.cjs). Read each test as arrange → act → assert. Setup creates a controlled initial state, the action exercises the application code, and assertions compare observable behavior with an independently stated expectation.

```javascript
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const harness = require('./database.cjs');
harness.configure();
const db = require('../src/config/db');
const service = require('../src/services/expenseService');
let clean, food, travel;
before(async () => {
    clean = await harness.prepare(db, require('../db/migrations/202607030301_create_expense_tracker').up);
    [food, travel] = await db('categories').insert([{ name: 'Food', icon: 'food', color: '#123456' }, { name: 'Travel', icon: 'bus', color: '#654321' }]).returning('*');
    await db('expenses').insert([
        { amount: 99, description: 'Before', category_id: food.id, expense_date: '2024-01-31' },
        { amount: 10.10, description: 'First day', category_id: food.id, expense_date: '2024-02-01' },
        { amount: 20.20, description: 'Leap day', category_id: food.id, expense_date: '2024-02-29' },
        { amount: 4.70, description: 'Bus', category_id: travel.id, expense_date: '2024-02-15' },
        { amount: 777, description: 'After', category_id: food.id, expense_date: '2024-03-01' },
    ]);
});
after(async () => { if (clean)
    await clean(); });
test('monthly total and count include the leap day and exclude adjacent months', async () => {
    const summary = await service.monthlySummary('2024-02');
    assert.equal(summary.total_spent, 35);
    assert.equal(summary.expense_count, 3);
    const empty = await service.monthlySummary('2025-01');
    assert.equal(empty.total_spent, 0);
    assert.equal(empty.expense_count, 0);
});
test('category SQL executes and reconciles with monthly and daily totals', async () => {
    const rows = await service.byCategory({ start_date: '2024-02-01', end_date: '2024-02-29' });
    assert.equal(rows.find(x => x.name === 'Food').total, 30.3);
    assert.equal(rows.find(x => x.name === 'Travel').total, 4.7);
    const daily = await service.dailyTrend('2024-02');
    assert.equal(daily.reduce((sum, x) => sum + Math.round(x.total * 100), 0), 3500);
    const filtered = await service.byCategory({ start_date: '2024-02-01', end_date: '2024-02-29', category_id: travel.id });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].total, 4.7);
});
test('date/filter/money validation fails before malformed data reaches SQL', async () => {
    assert.throws(() => service.monthlySummary('2024-13'));
    assert.throws(() => service.byCategory({ start_date: '2024-02-30' }));
    assert.throws(() => service.byCategory({ start_date: '2024-03-01', end_date: '2024-02-01' }));
    for (const amount of [Infinity, -1, 0, 1.001])
        await assert.rejects(() => service.createExpense({ amount, description: 'Invalid', category_id: food.id, expense_date: '2024-02-01' }));
});

test('each amount rule has its own message', async () => {
    // parseExpense is private; createExpense validates first and rejects before any write.
    const base = { description: 'x', category_id: food.id, expense_date: '2024-02-01' };
    const before = Number((await db('expenses').count('* as n').first()).n);
    for (const [amount, message] of [
        ['abc', /finite number/],
        [0, /greater than zero/],
        [-5, /greater than zero/],
        [1.001, /two decimal places/],
        [100000000, /not exceed/],
    ]) await assert.rejects(service.createExpense({ ...base, amount }), message, String(amount));
    assert.equal(Number((await db('expenses').count('* as n').first()).n), before);
});
```

## Explain it back

Give a five-minute walkthrough: the original problem, one invariant, the exact changed function, the most revealing failure test, and one remaining limitation. You should be able to explain why the implementation is correct for the worked example without reading the code aloud line by line.
