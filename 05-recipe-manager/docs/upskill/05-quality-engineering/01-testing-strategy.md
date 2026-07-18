# Testing Strategy

Project: **Recipe Manager** (`05-recipe-manager`)

## Layers

| Layer | What belongs here | Anchor |
| --- | --- | --- |
| Unit | pure helpers and service branches | `server/src/services/recipeService.ts:17` |
| API integration | route/controller/service/model contract | `server/src/routes/recipeRoutes.ts:1` |
| DB/migration | schema constraints and seed assumptions | `server/db/migrations/001_initial_schema.ts:5` |
| UI | state, forms, rendering, error states | `client/src/App.tsx:19` |
| Contract/type | request and response shapes | `client/src/services/api.ts:4` |

## What Not To Test

Do not assert implementation details like internal hook state unless behavior requires it. Do test user-visible behavior and API contracts.

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
