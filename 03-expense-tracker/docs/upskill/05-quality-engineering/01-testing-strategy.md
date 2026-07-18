# Testing Strategy

Project: **Personal Expense Tracker** (`03-expense-tracker`)

## Layers

| Layer | What belongs here | Anchor |
| --- | --- | --- |
| Unit | pure helpers and service branches | `server/src/services/expenseService.js:12` |
| API integration | route/controller/service/model contract | `server/src/routes/expenseRoutes.js:5` |
| DB/migration | schema constraints and seed assumptions | `server/db/migrations/202607030301_create_expense_tracker.js:7` |
| UI | state, forms, rendering, error states | `client/src/App.jsx:82` |
| Contract/type | request and response shapes | `client/src/services/api.js:3` |

## What Not To Test

Do not assert implementation details like internal hook state unless behavior requires it. Do test user-visible behavior and API contracts.

## Verification Notes

- Generated from inspected files in `03-expense-tracker`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/expenseRoutes.js`, `server/src/services/expenseService.js`, `server/src/models/expenseModel.js`, `server/db/migrations/202607030301_create_expense_tracker.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
