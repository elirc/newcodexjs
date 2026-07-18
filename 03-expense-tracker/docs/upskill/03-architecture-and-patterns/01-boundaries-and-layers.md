# Boundaries And Layers

Project: **Personal Expense Tracker** (`03-expense-tracker`)

| Layer | Owns | Must Not Own | Anchor |
| --- | --- | --- | --- |
| UI | rendering, local interaction | SQL, secrets | `client/src/App.jsx:82` |
| Client API | HTTP contract | domain rules | `client/src/services/api.js:3` |
| Routes | paths and verbs | business branching | `server/src/routes/expenseRoutes.js:5` |
| Controllers | parsing and envelopes | persistence details | `server/src/controllers/expenseController.js:5` |
| Services | validation and invariants | raw HTTP concerns | `server/src/services/expenseService.js:12` |
| Models | Knex queries | UI decisions | `server/src/models/expenseModel.js:1` |
| Migrations | durable schema | request logic | `server/db/migrations/202607030301_create_expense_tracker.js:7` |

Boundary leak to investigate: any validation duplicated inconsistently between UI and service.

## Verification Notes

- Generated from inspected files in `03-expense-tracker`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/expenseRoutes.js`, `server/src/services/expenseService.js`, `server/src/models/expenseModel.js`, `server/db/migrations/202607030301_create_expense_tracker.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
