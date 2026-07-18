# Validation, Auth, And Permissions

Project: **Personal Expense Tracker** (`03-expense-tracker`)

## Validation Map

- Client validation: `client/src/App.jsx:82`.
- API contract validation: `client/src/services/api.js:3`.
- Server/domain validation: `server/src/services/expenseService.js:12`.
- Database constraints: `server/db/migrations/202607030301_create_expense_tracker.js:7`.

## Auth Map

This project is mostly demo/local and may not include full authentication. Treat that as a learning limitation, not a production pattern.

## What A Junior Might Miss

A hidden input or disabled UI button is not authorization. The server must enforce ownership and permission checks.

## What A Senior Checks

IDOR risk, tenant/user scoping, cookie/session settings, CSRF expectations, and whether validation happens before side effects.

## Verification Notes

- Generated from inspected files in `03-expense-tracker`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/expenseRoutes.js`, `server/src/services/expenseService.js`, `server/src/models/expenseModel.js`, `server/db/migrations/202607030301_create_expense_tracker.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
