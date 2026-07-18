# Type System And Contracts

Project: **Recipe Manager** (`05-recipe-manager`)

This project is TypeScript-based in later-tier style.

## Contracts To Watch

- UI form shape: `client/src/App.tsx:19`.
- HTTP request/response shape: `client/src/services/api.ts:4` and `server/src/routes/recipeRoutes.ts:1`.
- Domain payload shape: `server/src/services/recipeService.ts:17`.
- Database row shape: `server/db/migrations/001_initial_schema.ts:5`.

## Junior Mistake

Treating the database row as the UI state. Better: let the API service normalize response shape so the UI is not coupled to persistence.

## Drill

Write a small contract table: field, source, validation owner, persistence column, display owner.

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
