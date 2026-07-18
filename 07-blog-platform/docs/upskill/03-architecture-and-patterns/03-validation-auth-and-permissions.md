# Validation, Auth, And Permissions

Project: **Blog Platform** (`07-blog-platform`)

## Validation Map

- Client validation: `client/src/App.tsx:17`.
- API contract validation: `client/src/services/api.ts:4`.
- Server/domain validation: `server/src/services/service.ts:5`.
- Database constraints: `server/db/migrations/001_init.ts:4`.

## Auth Map

This project is mostly demo/local and may not include full authentication. Treat that as a learning limitation, not a production pattern.

## What A Junior Might Miss

A hidden input or disabled UI button is not authorization. The server must enforce ownership and permission checks.

## What A Senior Checks

IDOR risk, tenant/user scoping, cookie/session settings, CSRF expectations, and whether validation happens before side effects.

## Verification Notes

- Generated from inspected files in `07-blog-platform`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
