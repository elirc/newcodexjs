# Security Checklist

Project: **Recipe Manager** (`05-recipe-manager`)

| Risk | What to inspect | Anchor |
| --- | --- | --- |
| Authorization/IDOR | resource owner checks | `server/src/services/recipeService.ts:17` |
| Input validation | server-side validation before writes | `server/src/services/recipeService.ts:17` |
| SQL injection | Knex bindings vs raw strings | `server/src/models/recipeModel.ts:2` |
| XSS | rendering user content safely | `client/src/App.tsx:19` |
| CSRF/session | cookies and auth flows if present | `server/src/app.ts:3` |
| Secrets | env handling | `server/src/config/env.ts:18` |
| File upload | type/size/storage if present | service/controller files |
| External URL/SSRF | metadata fetching if present | service files |

## Pre-Merge Checklist

- Does the server enforce the rule, or only the UI?
- Does every write validate input?
- Can a user guess another resource id?
- Are errors useful without leaking secrets?

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
