# Trace Tables

Project: **Recipe Manager** (`05-recipe-manager`)

## UI To API Trace

| Step | File | Value Shape | Owner | Transformation | Risk |
| --- | --- | --- | --- | --- | --- |
| User input | `client/src/App.tsx:19` | form state | UI | event -> state | stale or invalid value |
| API call | `client/src/services/api.ts:4` | JSON payload | client API | state -> HTTP | contract drift |
| Route | `server/src/routes/recipeRoutes.ts:1` | request | transport | method/path -> handler | wrong route |
| Service | `server/src/services/recipeService.ts:17` | domain payload | domain | validate/normalize | missing invariant |
| Model | `server/src/models/recipeModel.ts:2` | row/query | persistence | payload -> SQL | unbounded or unsafe query |

## Error Trace

| Step | File | Failure | Translation |
| --- | --- | --- | --- |
| Service rejects | `server/src/services/recipeService.ts:17` | validation/business error | throw typed error if present |
| Middleware | `server/src/middleware/errorHandler.ts:2` | exception | standard error envelope |
| Client | `client/src/services/api.ts:4` | HTTP failure | user-facing error state |

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
