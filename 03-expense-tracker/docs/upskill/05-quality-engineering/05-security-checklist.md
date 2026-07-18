# Security Checklist

Project: **Personal Expense Tracker** (`03-expense-tracker`)

| Risk | What to inspect | Anchor |
| --- | --- | --- |
| Authorization/IDOR | resource owner checks | `server/src/services/expenseService.js:12` |
| Input validation | server-side validation before writes | `server/src/services/expenseService.js:12` |
| SQL injection | Knex bindings vs raw strings | `server/src/models/expenseModel.js:1` |
| XSS | rendering user content safely | `client/src/App.jsx:82` |
| CSRF/session | cookies and auth flows if present | `server/src/app.js:1` |
| Secrets | env handling | `server/src/config/env.js:10` |
| File upload | type/size/storage if present | service/controller files |
| External URL/SSRF | metadata fetching if present | service files |

## Pre-Merge Checklist

- Does the server enforce the rule, or only the UI?
- Does every write validate input?
- Can a user guess another resource id?
- Are errors useful without leaking secrets?

## Verification Notes

- Generated from inspected files in `03-expense-tracker`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/expenseRoutes.js`, `server/src/services/expenseService.js`, `server/src/models/expenseModel.js`, `server/db/migrations/202607030301_create_expense_tracker.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
