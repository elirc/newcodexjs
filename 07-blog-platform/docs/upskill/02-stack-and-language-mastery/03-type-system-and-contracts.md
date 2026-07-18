# Type System And Contracts

Project: **Blog Platform** (`07-blog-platform`)

This project is TypeScript-based in later-tier style.

## Contracts To Watch

- UI form shape: `client/src/App.tsx:17`.
- HTTP request/response shape: `client/src/services/api.ts:4` and `server/src/routes/routes.ts:4`.
- Domain payload shape: `server/src/services/service.ts:5`.
- Database row shape: `server/db/migrations/001_init.ts:4`.

## Junior Mistake

Treating the database row as the UI state. Better: let the API service normalize response shape so the UI is not coupled to persistence.

## Drill

Write a small contract table: field, source, validation owner, persistence column, display owner.

## Verification Notes

- Generated from inspected files in `07-blog-platform`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
