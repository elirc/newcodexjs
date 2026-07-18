# Security Checklist

Project: **Notes App** (`04-notes-app`)

| Risk | What to inspect | Anchor |
| --- | --- | --- |
| Authorization/IDOR | resource owner checks | `server/src/services/service.js:3` |
| Input validation | server-side validation before writes | `server/src/services/service.js:3` |
| SQL injection | Knex bindings vs raw strings | `server/src/models/model.js:1` |
| XSS | rendering user content safely | `client/src/App.jsx:18` |
| CSRF/session | cookies and auth flows if present | `server/src/app.js:2` |
| Secrets | env handling | `server/src/config/env.js:8` |
| File upload | type/size/storage if present | service/controller files |
| External URL/SSRF | metadata fetching if present | service files |

## Pre-Merge Checklist

- Does the server enforce the rule, or only the UI?
- Does every write validate input?
- Can a user guess another resource id?
- Are errors useful without leaking secrets?

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
