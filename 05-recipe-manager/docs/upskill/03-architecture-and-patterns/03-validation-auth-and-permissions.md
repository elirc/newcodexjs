# Validation, Auth, And Permissions

Project: **Recipe Manager** (`05-recipe-manager`)

## Validation Map

- Client validation: `client/src/App.tsx:19`.
- API contract validation: `client/src/services/api.ts:4`.
- Server/domain validation: `server/src/services/recipeService.ts:17`.
- Database constraints: `server/db/migrations/001_initial_schema.ts:5`.

## Auth Map

This project introduces JWT and protected routes. Inspect auth-related services and middleware in addition to the anchors below.

## What A Junior Might Miss

A hidden input or disabled UI button is not authorization. The server must enforce ownership and permission checks.

## What A Senior Checks

IDOR risk, tenant/user scoping, cookie/session settings, CSRF expectations, and whether validation happens before side effects.

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
