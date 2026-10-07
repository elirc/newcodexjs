# FABLE Guide — Personal Expense Tracker

**Project 3: the layered skeleton from Projects 1–2, now with the skill that quietly
separates juniors from mids — aggregation SQL and dashboard endpoints.** CRUD moves
rows; aggregation answers questions ("how much did I spend on food this month, and am
I over budget?"). This project is where the database stops being a filing cabinet and
becomes a calculator.

Prerequisites: Project 1's FABLE guide (layers, envelope) and Project 2's (filters,
list-state). New here: GROUP BY endpoints, per-category budgets with status math,
date-range filtering, Recharts on the client, and money handling.

---

## 1. What is new in this project

| Pattern | Where it lives | Why it matters |
|---|---|---|
| Aggregation endpoints | `server/src/routes/statsRoutes.js` → `statsController.js` | `/monthly`, `/weekly`, `/by-category`, `/daily-trend` — each one is a GROUP BY you can read. |
| Multiple resources | `expenseRoutes` / `categoryRoutes` / `budgetRoutes` / `statsRoutes` | Four route modules mounted side by side; the app is now big enough that organization pays. |
| Budgets with derived status | `budgetController.js` → `listBudgets` in `expenseService.js` | Budget vs. actual → `ok` / `warning` / `exceeded`. Business rules computed from aggregates. |
| Date-range filtering | expense list | `?start_date=&end_date=` (both inclusive) — inclusive/exclusive boundaries, month edges, timezone traps. |
| Charts | client + Recharts | Turning API aggregates into a bar/pie/line chart, and shaping API responses *for* charts. |
| Money | everywhere | Why amounts should be `numeric` in Postgres and what `0.1 + 0.2` does in JS. |

**Stack:** React 18 + Vite + Recharts / Express + Knex + PostgreSQL / JavaScript.

---

## 2. Run it (10 minutes)

```bash
createdb expense_tracker_dev
cd 03-expense-tracker/server && npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 03-expense-tracker/client && npm install && npm run dev
```

Server default port is **3003** (`server/src/config/env.js`); client on :5173.
Copy `.env.example` → `.env` first.

**Interrogate the aggregation endpoints directly — this is the fastest way to learn them:**

```bash
curl "http://localhost:3003/api/stats/monthly?month=2026-07"   # seed data is all July 2026; no month = current UTC month
curl "http://localhost:3003/api/stats/by-category?start_date=2026-07-01&end_date=2026-07-31"
curl "http://localhost:3003/api/stats/daily-trend?month=2026-07"
curl "http://localhost:3003/api/expenses?start_date=2026-07-01&end_date=2026-07-31&category_id=1"
curl "http://localhost:3003/api/expenses/export?start_date=2026-07-01&end_date=2026-07-31"
```

Compare each JSON response against what the dashboard shows. The client is just a
renderer for these endpoints.

---

## 3. Guided code tour (read in this order)

| # | File | Notice this |
|---|------|-------------|
| 1 | `server/src/app.js` | Four routers mounted under `/api/...`. This is how apps grow without controllers bloating. |
| 2 | `server/src/routes/statsRoutes.js` + `controllers/statsController.js` | Thin as always. The interesting work is one layer down. |
| 3 | `server/src/models/expenseModel.js` | **The heart of the project.** Find the GROUP BY queries: sum by month, by category, by day. For each one, write the raw SQL it generates, then verify with `DEBUG=knex:query npm run dev`. |
| 4 | `controllers/budgetController.js` + `listBudgets` in `services/expenseService.js` | How "spent this month" (an aggregate) is joined against "budget amount" (a row) to compute status. Where is the warning threshold defined — code or data? |
| 5 | `server/src/services/expenseService.js` | Date-range validation. What happens with `start_date > end_date`? With an invalid date string? |
| 6 | `server/src/utils/csv.js` | Same boundary lesson as Project 2 — now with money formatting decisions. |
| 7 | `client/src/App.jsx` (`Dashboard`) | How API aggregate shapes map to Recharts props. Notice any reshaping the client does — then ask whether the API should have returned chart-ready data instead. |
| 8 | Seed file (`server/db/seeds/`) | Good seeds make aggregates verifiable: you can hand-compute July's Groceries total and check it against `/api/stats/by-category`. |

---

## 4. Trace this flow

**"The category pie chart renders":** dashboard mounts → client calls
`GET /api/stats/by-category` → controller passes `start_date`/`end_date` → `validFilters` validates them →
model runs `SELECT category, SUM(amount) ... GROUP BY` join → envelope back →
client maps rows to Recharts `<Pie data={...}>`.

Then answer three questions:
1. What happens to categories with **zero** expenses this month — do they appear? Should they?
2. Is the sum computed in SQL or in JavaScript? Why does it matter at 100k rows?
3. If the client and server disagree on what "this month" means (UTC vs. local), which
   endpoint shows the bug first?

---

## 5. The challenge ladder

### Level 1 — Junior
1. **Add a "this month" quick filter button** that sets `start_date`/`end_date` to the current
   month's boundaries. Get the month-end right (28/29/30/31) without hardcoding.
2. **Hand-verify one aggregate:** pick a category, sum its July seed expenses (all seed expenses are dated July 2026) on paper,
   and confirm the API agrees. If it doesn't, you found either a timezone bug or an
   off-by-one date boundary — both are worth the hunt.

### Level 2 — Mid
3. **Add a yearly stats endpoint** (`GET /api/stats/yearly`): total per month for a
   given year, including **zero months** (this forces you past a naive GROUP BY —
   generate the month series and left-join, or fill gaps in the service).
4. **Budget rollover flag:** add `rollover` to budgets; unspent budget carries into next
   month. Write the design note first: does rollover get computed on read or
   materialized on month close? What are the costs of each?
5. **Test the money math:** write unit tests for budget status boundaries (spent equal
   to budget, one cent over, warning threshold exactly). Floating point will try to
   embarrass you; decide whether to compute in cents.

### Level 3 — Senior
6. **Push vs. pull for chart shapes (1 page):** the API returns aggregates already shaped
   for Recharts (`App.jsx` passes them straight through). Argue both sides of "the API should return chart-ready
   series." Consider: multiple clients, chart library swaps, API versioning.
7. **Index audit:** every stats endpoint filters by date, and by-category also groups by category. Propose
   the indexes, then prove one works with `EXPLAIN ANALYZE` before/after on seeded data.
8. **Precision memo:** amounts flow Postgres `numeric` → JSON → JS `number` → display.
   Identify every point where precision can be lost and what a payments-grade version
   would do differently (integer cents, string decimals in JSON).

---

## 6. Questions you should be able to answer afterward

- Why compute sums in SQL instead of fetching rows and summing in JS? Give the two resource costs.
- What is the difference between `WHERE` and `HAVING`, using the by-category endpoint as the example?
- Why is `date` (not `timestamp`) often the right column type for an expense, and what bug does it prevent?
- Where should "warning at 80% of budget" live: client, service, or database? Defend one.
- What breaks if two budget rows exist for the same category and month, and which constraint prevents it?

## 7. Common traps

- **Month boundaries:** `end_date=2026-06-30` with a `<` comparison silently drops June 30. Decide inclusive vs. exclusive and be consistent.
- **JS floating point:** `0.1 + 0.2 !== 0.3`. Postgres `numeric` arrives in JS as a string via `pg` — check what this codebase does with it before doing arithmetic.
- **GROUP BY gaps:** months/days with no expenses vanish from results; charts then draw misleadingly connected lines.
- **Filters on export drifting** from filters on list — same lesson as Project 2's count query.

Next: Project 4 (`04-notes-app`) — Postgres full-text search, markdown rendering, and
the autosave pattern.
