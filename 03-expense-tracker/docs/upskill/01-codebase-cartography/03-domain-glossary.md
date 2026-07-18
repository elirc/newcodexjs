# Domain Glossary

Project: **Personal Expense Tracker** (`03-expense-tracker`)

## expense

Meaning in this project: a core domain term used to reason about expense CRUD, aggregation, dashboards, budgets.

Where to look:
- `client/src/App.jsx` for user-facing behavior.
- `server/src/services/expenseService.js` for rules involving expense.
- `server/db/migrations/202607030301_create_expense_tracker.js` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## category

Meaning in this project: a core domain term used to reason about expense CRUD, aggregation, dashboards, budgets.

Where to look:
- `client/src/App.jsx` for user-facing behavior.
- `server/src/services/expenseService.js` for rules involving category.
- `server/db/migrations/202607030301_create_expense_tracker.js` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## budget

Meaning in this project: a core domain term used to reason about expense CRUD, aggregation, dashboards, budgets.

Where to look:
- `client/src/App.jsx` for user-facing behavior.
- `server/src/services/expenseService.js` for rules involving budget.
- `server/db/migrations/202607030301_create_expense_tracker.js` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## monthly summary

Meaning in this project: a core domain term used to reason about expense CRUD, aggregation, dashboards, budgets.

Where to look:
- `client/src/App.jsx` for user-facing behavior.
- `server/src/services/expenseService.js` for rules involving monthly summary.
- `server/db/migrations/202607030301_create_expense_tracker.js` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## CSV export

Meaning in this project: a core domain term used to reason about expense CRUD, aggregation, dashboards, budgets.

Where to look:
- `client/src/App.jsx` for user-facing behavior.
- `server/src/services/expenseService.js` for rules involving CSV export.
- `server/db/migrations/202607030301_create_expense_tracker.js` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## Verification Notes

- Generated from inspected files in `03-expense-tracker`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/expenseRoutes.js`, `server/src/services/expenseService.js`, `server/src/models/expenseModel.js`, `server/db/migrations/202607030301_create_expense_tracker.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
