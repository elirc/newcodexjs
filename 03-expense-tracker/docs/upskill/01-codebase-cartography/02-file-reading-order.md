# File Reading Order

Project: **Personal Expense Tracker** (`03-expense-tracker`)

## Junior Path

1. `client/src/App.jsx` - Start with user-facing state and rendering; do not get lost in CSS.
2. `client/src/services/api.js` - Read request URLs and response unwrapping; look for contract assumptions.
3. `server/src/app.js` - Find middleware order and route mounting.
4. `server/src/routes/expenseRoutes.js` - Map API verbs to controllers.
5. `server/src/controllers/expenseController.js` - Confirm controllers are thin.
6. `server/src/services/expenseService.js` - Study validation, invariants, and branching.
7. `server/src/models/expenseModel.js` - Study query shape and persistence ownership.
8. `server/db/migrations/202607030301_create_expense_tracker.js` - Read schema as the durable contract.

## Mid-Level Path

1. `client/src/App.jsx` - Start with user-facing state and rendering; do not get lost in CSS.
2. `client/src/services/api.js` - Read request URLs and response unwrapping; look for contract assumptions.
3. `server/src/app.js` - Find middleware order and route mounting.
4. `server/src/routes/expenseRoutes.js` - Map API verbs to controllers.
5. `server/src/controllers/expenseController.js` - Confirm controllers are thin.
6. `server/src/services/expenseService.js` - Study validation, invariants, and branching.
7. `server/src/models/expenseModel.js` - Study query shape and persistence ownership.
8. `server/db/migrations/202607030301_create_expense_tracker.js` - Read schema as the durable contract.
9. `server/db/seeds/001_expenses.js` - Understand demo states and edge cases.
10. `server/src/middleware/errors.js` - Understand how errors become API responses.
11. `server/src/config/env.js` - Learn runtime configuration and secret boundaries.
12. `server/knexfile.js` - Learn CLI database wiring.

## Senior Path

1. Start at `server/db/migrations/202607030301_create_expense_tracker.js` and ask whether the schema supports future change.
2. Move to `server/src/services/expenseService.js` and look for implicit invariants.
3. Move to `server/src/models/expenseModel.js` and look for unbounded queries, N+1 risk, and transaction boundaries.
4. Move to `server/src/middleware/errors.js` and inspect observability and failure contracts.
5. Finish at `client/src/services/api.js` and ask whether public contracts are stable.

## Pause And Predict

Before opening `server/src/services/expenseService.js`, predict where validation should live. After reading, grade whether the code matches that boundary.

## Verification Notes

- Generated from inspected files in `03-expense-tracker`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/expenseRoutes.js`, `server/src/services/expenseService.js`, `server/src/models/expenseModel.js`, `server/db/migrations/202607030301_create_expense_tracker.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
