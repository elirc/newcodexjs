# Security Checklist

Project: **Personal Task Manager** (`01-task-manager`)

| Risk | What to inspect | Anchor |
| --- | --- | --- |
| Authorization/IDOR | resource owner checks | `server/src/services/taskService.js:17` |
| Input validation | server-side validation before writes | `server/src/services/taskService.js:17` |
| SQL injection | Knex bindings vs raw strings | `server/src/models/taskModel.js:1` |
| XSS | rendering user content safely | `client/src/App.jsx:7` |
| CSRF/session | cookies and auth flows if present | `server/src/app.js:1` |
| Secrets | env handling | `server/src/config/env.js:14` |
| File upload | type/size/storage if present | service/controller files |
| External URL/SSRF | metadata fetching if present | service files |

## Pre-Merge Checklist

- Does the server enforce the rule, or only the UI?
- Does every write validate input?
- Can a user guess another resource id?
- Are errors useful without leaking secrets?

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
