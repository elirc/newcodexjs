# Security Checklist

Project: **Kanban Board** (`08-kanban-board`)

| Risk | What to inspect | Anchor |
| --- | --- | --- |
| Authorization/IDOR | resource owner checks | `server/src/services/service.ts:5` |
| Input validation | server-side validation before writes | `server/src/services/service.ts:5` |
| SQL injection | Knex bindings vs raw strings | `server/src/models/model.ts:1` |
| XSS | rendering user content safely | `client/src/App.tsx:17` |
| CSRF/session | cookies and auth flows if present | `server/src/app.ts:2` |
| Secrets | env handling | `server/src/config/env.ts:8` |
| File upload | type/size/storage if present | service/controller files |
| External URL/SSRF | metadata fetching if present | service files |

## Pre-Merge Checklist

- Does the server enforce the rule, or only the UI?
- Does every write validate input?
- Can a user guess another resource id?
- Are errors useful without leaking secrets?

## Verification Notes

- Generated from inspected files in `08-kanban-board`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
