# Trace Tables

Project: **Notes App** (`04-notes-app`)

## UI To API Trace

| Step | File | Value Shape | Owner | Transformation | Risk |
| --- | --- | --- | --- | --- | --- |
| User input | `client/src/App.jsx:18` | form state | UI | event -> state | stale or invalid value |
| API call | `client/src/services/api.js:4` | JSON payload | client API | state -> HTTP | contract drift |
| Route | `server/src/routes/routes.js:3` | request | transport | method/path -> handler | wrong route |
| Service | `server/src/services/service.js:3` | domain payload | domain | validate/normalize | missing invariant |
| Model | `server/src/models/model.js:1` | row/query | persistence | payload -> SQL | unbounded or unsafe query |

## Error Trace

| Step | File | Failure | Translation |
| --- | --- | --- | --- |
| Service rejects | `server/src/services/service.js:3` | validation/business error | throw typed error if present |
| Middleware | `server/src/middleware/errorMiddleware.js:1` | exception | standard error envelope |
| Client | `client/src/services/api.js:4` | HTTP failure | user-facing error state |

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
