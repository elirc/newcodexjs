# Side Effects, Async, And Reliability

Project: **Personal Expense Tracker** (`03-expense-tracker`)

Side effects in Tier 1 are intentionally limited, but the project may include email, uploads, metadata fetches, CSV export, or reporting.

## Reliability Concepts

- Idempotency: retrying should not duplicate records.
- Timeout: external calls should not hang request workers forever.
- Backpressure: expensive flows should avoid unbounded work.
- Visibility: failures should be logged and returned through the error envelope.

## Inspect

- API side effects near `server/src/services/expenseService.js:12`.
- Persistence writes near `server/src/models/expenseModel.js:1`.
- Error translation near `server/src/middleware/errors.js:3`.

## Drill

Pick one write flow. Ask: if the database write succeeds but the UI refresh fails, what state does the user see?

## Verification Notes

- Generated from inspected files in `03-expense-tracker`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/expenseRoutes.js`, `server/src/services/expenseService.js`, `server/src/models/expenseModel.js`, `server/db/migrations/202607030301_create_expense_tracker.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
