# Trace Tables

Project: **Personal Task Manager** (`01-task-manager`)

## UI To API Trace

| Step | File | Value Shape | Owner | Transformation | Risk |
| --- | --- | --- | --- | --- | --- |
| User input | `client/src/App.jsx:7` | form state | UI | event -> state | stale or invalid value |
| API call | `client/src/services/tasksApi.js:1` | JSON payload | client API | state -> HTTP | contract drift |
| Route | `server/src/routes/taskRoutes.js:5` | request | transport | method/path -> handler | wrong route |
| Service | `server/src/services/taskService.js:17` | domain payload | domain | validate/normalize | missing invariant |
| Model | `server/src/models/taskModel.js:1` | row/query | persistence | payload -> SQL | unbounded or unsafe query |

## Error Trace

| Step | File | Failure | Translation |
| --- | --- | --- | --- |
| Service rejects | `server/src/services/taskService.js:17` | validation/business error | throw typed error if present |
| Middleware | `server/src/middleware/errorMiddleware.js:1` | exception | standard error envelope |
| Client | `client/src/services/tasksApi.js:1` | HTTP failure | user-facing error state |

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
