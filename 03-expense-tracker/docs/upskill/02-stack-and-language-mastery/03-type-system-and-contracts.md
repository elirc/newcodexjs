# Type System And Contracts

Project: **Personal Expense Tracker** (`03-expense-tracker`)

This project is JavaScript-based for early Tier 1 fundamentals.

## Contracts To Watch

- UI form shape: `client/src/App.jsx:82`.
- HTTP request/response shape: `client/src/services/api.js:3` and `server/src/routes/expenseRoutes.js:5`.
- Domain payload shape: `server/src/services/expenseService.js:12`.
- Database row shape: `server/db/migrations/202607030301_create_expense_tracker.js:7`.

## Junior Mistake

Treating the database row as the UI state. Better: let the API service normalize response shape so the UI is not coupled to persistence.

## Drill

Write a small contract table: field, source, validation owner, persistence column, display owner.

## Verification Notes

- Generated from inspected files in `03-expense-tracker`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/expenseRoutes.js`, `server/src/services/expenseService.js`, `server/src/models/expenseModel.js`, `server/db/migrations/202607030301_create_expense_tracker.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
