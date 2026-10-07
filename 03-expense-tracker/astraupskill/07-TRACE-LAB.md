# Trace lab: calculate report results before running SQL

[Course index](README.md)

## Run it before you trace it

The first executable example from chapter 03, so the trace starts from a request you have actually sent:

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

Watch the server log while it runs, then follow the boundaries below with that exact request in mind.

## Use an independent fixture

| Date | Category | Amount |
|---|---|---:|
| 2024-01-31 | Food | 99.00 |
| 2024-02-01 | Food | 10.10 |
| 2024-02-15 | Travel | 4.70 |
| 2024-02-29 | Food | 20.20 |
| 2024-03-01 | Food | 777.00 |

February has three expenses, Food 30.30, Travel 4.70 and total 35.00. The conspicuous neighboring values make leaked boundaries obvious. Derive expectations from this table rather than copying the query's filter into the test.

## Trace the real call path

### Boundary 1 — the report screen asks for a window

`client/src/App.jsx` (there is no `features` folder in this client) uses a hard-coded `month = "2026-07"` (line 7) and calls the API through `client/src/services/api.js` with `month=YYYY-MM` or `start_date`/`end_date` (lines 98-102 of `App.jsx`); the client never sums anything itself, it renders the server's totals.

### Boundary 2 — the request leaves the browser

`GET /api/reports/monthly?month=2024-02`, `GET /api/reports/by-category?start_date=...&end_date=...` through the client's API service; errors arrive as the envelope's `error.message`.

### Boundary 3 — the service validates the filters

`server/src/services/expenseService.js`: `validDate` rejects impossible dates (`2024-02-30`) before SQL; `parseExpense` (line 12) now gives one message per amount rule; `byCategory`/`monthlySummary` build the filter object the model needs.

### Boundary 4 — the model builds the aggregate query

`server/src/models/expenseModel.js`: `expenseQuery(filters)` applies the date range and optional category; `byCategory` (line 166) clears the select and groups by `categories.id` with `SUM(expenses.amount)::float`; `monthlySummary` and the daily report derive their windows from the month. The two window conventions are the subject of exercise 7.

### Boundary 5 — PostgreSQL computes the totals

`amount` is `numeric(...)`; the sum is exact until the `::float` cast in the select. The tests seed five rows (`reports.test.cjs` `before`) and reconcile category, daily and monthly totals in cents to detect any drift.

### Boundary 6 — the envelope returns numbers the client renders

`sendSuccess` returns `{ success: true, data }` where totals are floats; exercise 4's worked solution returns `total_cents` alongside so the client can format exactly.

## Understand intervals and projection

The monthly window includes February 1 and excludes March 1. Leap day falls inside naturally. The category range endpoint instead includes both supplied start and end dates; callers need that distinction.

An ordinary list selects every expense field. A grouped report returns one row per category. Which individual expense description would represent the whole category? Retaining expenses.* makes the selection ambiguous and causes the PostgreSQL error addressed here.

The model calls clearSelect() before adding grouped fields, SUM and COUNT. It replaces the projection while retaining needed joins and filters. Open [expenseModel.js](../server/src/models/expenseModel.js) and annotate each clause.

## Inspect boundary values and representations

Reject month 2024-13, impossible date 2026-02-30, year zero and reversed ranges. Amounts must be finite, positive, bounded and within supported decimal precision.

Database decimal aggregates can arrive as strings. Inspect service conversion before comparing or formatting them. SQL decimals and JavaScript numbers have different representation guarantees.

Run [reports.test.cjs](../server/test/reports.test.cjs). Change one fixture amount on paper and predict the category, month and daily totals affected. Independently derived views agreeing provides stronger evidence than a single plausible chart.
