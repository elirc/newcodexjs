# Trace Tables

Project: **Personal Expense Tracker** (`03-expense-tracker`)

## UI To API Trace

| Step | File | Value Shape | Owner | Transformation | Risk |
| --- | --- | --- | --- | --- | --- |
| User input | `client/src/App.jsx:82` | form state | UI | event -> state | stale or invalid value |
| API call | `client/src/services/api.js:3` | JSON payload | client API | state -> HTTP | contract drift |
| Route | `server/src/routes/expenseRoutes.js:5` | request | transport | method/path -> handler | wrong route |
| Service | `server/src/services/expenseService.js:12` | domain payload | domain | validate/normalize | missing invariant |
| Model | `server/src/models/expenseModel.js:1` | row/query | persistence | payload -> SQL | unbounded or unsafe query |

## Error Trace

| Step | File | Failure | Translation |
| --- | --- | --- | --- |
| Service rejects | `server/src/services/expenseService.js:12` | validation/business error | throw typed error if present |
| Middleware | `server/src/middleware/errors.js:3` | exception | standard error envelope |
| Client | `client/src/services/api.js:3` | HTTP failure | user-facing error state |

## Verification Notes

- Generated from inspected files in `03-expense-tracker`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/expenseRoutes.js`, `server/src/services/expenseService.js`, `server/src/models/expenseModel.js`, `server/db/migrations/202607030301_create_expense_tracker.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
