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
