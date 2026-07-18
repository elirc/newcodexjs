# Performance Thinking

Project: **Personal Expense Tracker** (`03-expense-tracker`)

## Domains

- Render: `client/src/App.jsx:82` can rerender too much if derived state is duplicated.
- Network: `client/src/services/api.js:3` should avoid redundant requests.
- Server: `server/src/services/expenseService.js:12` should not do unnecessary serial IO.
- Database: `server/src/models/expenseModel.js:1` should avoid unbounded list queries and missing indexes.
- Bundle: client dependencies should match real UI need.

## Measure First

Use browser network/devtools, server logs, SQL query inspection, and bundle output before optimizing.

## Drill

Find one list endpoint and design pagination. Include API shape, SQL shape, UI state, and tests.

## Verification Notes

- Generated from inspected files in `03-expense-tracker`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/expenseRoutes.js`, `server/src/services/expenseService.js`, `server/src/models/expenseModel.js`, `server/db/migrations/202607030301_create_expense_tracker.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
