# Trace Tables

Project: **Blog Platform** (`07-blog-platform`)

## UI To API Trace

| Step | File | Value Shape | Owner | Transformation | Risk |
| --- | --- | --- | --- | --- | --- |
| User input | `client/src/App.tsx:17` | form state | UI | event -> state | stale or invalid value |
| API call | `client/src/services/api.ts:4` | JSON payload | client API | state -> HTTP | contract drift |
| Route | `server/src/routes/routes.ts:4` | request | transport | method/path -> handler | wrong route |
| Service | `server/src/services/service.ts:5` | domain payload | domain | validate/normalize | missing invariant |
| Model | `server/src/models/model.ts:1` | row/query | persistence | payload -> SQL | unbounded or unsafe query |

## Error Trace

| Step | File | Failure | Translation |
| --- | --- | --- | --- |
| Service rejects | `server/src/services/service.ts:5` | validation/business error | throw typed error if present |
| Middleware | `server/src/middleware/errorMiddleware.ts:2` | exception | standard error envelope |
| Client | `client/src/services/api.ts:4` | HTTP failure | user-facing error state |

## Verification Notes

- Generated from inspected files in `07-blog-platform`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
