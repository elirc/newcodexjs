# Architecture

The app follows the Tier 1 layered shape: controllers parse HTTP, services own validation and business rules, models own Knex queries, and middleware returns the standard response envelope on errors. Every claim below was verified 2026-10-06 by reading source; citations are `path:line` from the project root.

## Backend

- Four routers are mounted side by side: expenses, categories, budgets, stats (`server/src/app.js:18`–21). Each handler is wrapped in `asyncHandler` (`server/src/middleware/errors.js:34`).
- All four controllers call one service, `server/src/services/expenseService.js`, and one model, `server/src/models/expenseModel.js` — there is no separate budget or category service file.
- `expenseModel` contains CRUD queries plus SQL aggregation using `SUM`, `COUNT`, `AVG`, `DATE_TRUNC`, and half-open date ranges: `monthlySummary` (`server/src/models/expenseModel.js:152`), `byCategory` (`server/src/models/expenseModel.js:166`), `dailyTrend` (`server/src/models/expenseModel.js:179`), `weeklyTrend` (`server/src/models/expenseModel.js:194`). Sums are cast `::float` before leaving SQL.
- `expenseService` validates amounts (finite, > 0, at most two decimals, ≤ 99,999,999.99), required description/category, real calendar dates, and recurring intervals in `parseExpense` (`server/src/services/expenseService.js:12`). Query filters go through `validFilters` (`server/src/services/expenseService.js:183`). There are no "category ownership" rules (there are no users); the only category rule is that default categories cannot be deleted (`server/src/models/expenseModel.js:102`).
- Budget status is computed in the service, not the database: `exceeded` above 100%, `warning` above 80% (`server/src/services/expenseService.js:142`). The sort column is whitelisted (`server/src/models/expenseModel.js:24`), so it cannot be used for SQL injection.
- `errorHandler` (`server/src/middleware/errors.js:46`) hides every 5xx message behind "Something went wrong".
- The reversible migration creates `categories`, `expenses`, and `budgets`. The seed creates 7 categories (5 default, 2 custom: Fitness, Books) (`server/db/seeds/001_expenses.js:11`), 6 budgets for July 2026 (`server/db/seeds/001_expenses.js:22`), and 60 expenses, all dated 2026-07-01 to 2026-07-28 (`server/db/seeds/001_expenses.js:30`). Five are recurring (indexes 0, 14, 28, 42, 56): three monthly, two weekly.

## Frontend

`client/src/App.jsx` provides four tabs: dashboard, expenses, budgets, and categories, and contains every component (`Dashboard`, `ExpenseForm`). The month is hard-coded as `"2026-07"` (`client/src/App.jsx:7`) to match the seed. API calls live in `client/src/services/api.js`; CSS Modules (`App.module.css`, `Button.module.css`) style the dashboard and forms. Recharts renders a pie (by category), bar (daily), and line (weekly) chart directly from the aggregation endpoints — the client does no reshaping. `react-router-dom` is listed in `client/package.json` but not imported.

## Request trace: create expense

1. `expenseApi.create` posts the form (`client/src/services/api.js:17`), called from `saveExpense` (`client/src/App.jsx:119`), which then reloads all seven datasets via `loadData` (`client/src/App.jsx:95`).
2. `POST /api/expenses` is mounted at `server/src/app.js:18` and routed at `server/src/routes/expenseRoutes.js:9`.
3. `create` returns 201 with the envelope (`server/src/controllers/expenseController.js:9`).
4. `createExpense` runs `parseExpense` and delegates (`server/src/services/expenseService.js:60`).
5. Model `createExpense` inserts, then re-reads through the category join so the response includes `category_name/color/icon` (`server/src/models/expenseModel.js:43`).
6. Schema: `expenses` (`server/db/migrations/202607030301_create_expense_tracker.js:15`); the DB repeats the amount and enum rules as CHECK constraints.

## Auth

There is none. A grep of `server/src`, `server/db`, and `client/src` for `jwt|token|cookie|auth|session` returns no hits; there is no users table, so all data is global. The only access restriction is CORS to `CLIENT_ORIGIN` (`server/src/app.js:14`, default `http://localhost:5173` at `server/src/config/env.js:15`), which browsers enforce and `curl` ignores — anyone who can reach port 3003 can delete expenses or budgets. The test harness sets unused `JWT_*`/`COOKIE_SECRET` variables (`server/test/database.cjs:18`).

## Data model

From `server/db/migrations/202607030301_create_expense_tracker.js`:

| Table | Columns | Constraints |
|---|---|---|
| categories (`:7`) | id serial PK; name varchar(50); icon varchar(50); color varchar(7); is_default boolean default false; created_at | name NOT NULL UNIQUE; icon, color NOT NULL |
| expenses (`:15`) | id; amount decimal(10,2); description varchar(255); category_id integer; expense_date date; payment_method varchar(30) default `cash`; is_recurring boolean default false; recurring_interval varchar(20); notes text; created_at/updated_at | FK category_id → categories.id with **no ON DELETE clause** (`server/db/migrations/202607030301_create_expense_tracker.js:19`); CHECK amount > 0; CHECK payment_method in five values; CHECK interval null/weekly/monthly |
| budgets (`:30`) | id; category_id integer; month date; amount decimal(10,2); created_at/updated_at | FK → categories.id (no ON DELETE); UNIQUE (category_id, month) (`server/db/migrations/202607030301_create_expense_tracker.js:36`); CHECK amount > 0 |

Indexes: PKs and the two UNIQUE constraints only. Nothing indexes `expenses.expense_date` or `expenses.category_id`, which every stats query filters or groups on.

## Senior findings (verified 2026-10-06 by reading source)

1. **FK violations surface as 500 with the wrong story.** `deleteCategory` (`server/src/models/expenseModel.js:102`) deletes any non-default category; if it still has expenses or a budget, Postgres raises an FK error (no `ON DELETE`), so the user gets a 500 "Something went wrong" instead of the friendly message the service only sends when zero rows matched (`server/src/services/expenseService.js:133`). Creating an expense with a non-existent `category_id` also passes `parseExpense` (presence check only, `server/src/services/expenseService.js:19`) and becomes a 500. Fix: pre-check usage, or catch code `23503` and throw `ValidationError`/409.
2. **Budget upsert skips the validation expenses get.** `upsertBudget` (`server/src/services/expenseService.js:156`) only slices `payload.month`; `month: "abcd"` reaches Postgres as `"abcd-01"` (500), a numeric month crashes on `.slice` (500), and amounts above `decimal(10,2)` or with three decimals are not checked. Fix: reuse `validMonth` and the amount rules from `parseExpense`.
3. **Unbounded list and export.** `listExpenses` (`server/src/models/expenseModel.js:23`) has no `limit`/`offset`; without a date filter `GET /api/expenses` and `/export` return every row. Fix: paginate the list (Project 2's pattern) and stream the export.

## Debugging scenario

**Symptom:** you change the hard-coded month to `"2026-06"` and the dashboard goes blank with an unhandled promise rejection.
**Where to look:** `loadData` builds `end_date: \`${month}-31\`` (`client/src/App.jsx:98` and `client/src/App.jsx:101`). `validDate` rejects `2026-06-31` because it round-trips through `Date` and compares (`server/src/services/expenseService.js:176`), returning 400 "Use a real calendar date". `Promise.all` rejects, so no state is set.
**Root cause:** the client assumes every month has 31 days.
**Fix:** compute the month's last day (`new Date(Date.UTC(y, m, 0))`) or add a `month` filter on the server, and catch errors in `loadData`.

## Growth ladder

1. **Goal:** Map the routers. **Check:** `grep -n 'app.use("/api' server/src/app.js` → 4 hits, lines 18–21.
2. **Goal:** Know where validation lives. **Check:** `grep -n "function valid" server/src/services/expenseService.js` → `validDate` 173, `validMonth` 179, `validFilters` 183.
3. **Goal:** Keep aggregation in SQL. **Check:** `grep -c "::float" server/src/models/expenseModel.js` → 5; write the raw SQL for each and confirm with `DEBUG=knex:query`.
4. **Goal:** Run and extend tests. **Check:** `grep -c "^test(" server/test/reports.test.cjs` → 4. Run locally (needs Postgres): `ASTRA_TEST_DATABASE_URL=postgres://…/astra_test_expenses npm test` in `server/` → 4 passing, including the leap-day monthly total of 35 (`server/test/reports.test.cjs:21`).
5. **Goal:** Translate DB errors deliberately. **Check:** `grep -rnE "23503|23505" server/src` returns nothing today; after fixing finding 1, deleting a used category returns 400/409 instead of 500.
