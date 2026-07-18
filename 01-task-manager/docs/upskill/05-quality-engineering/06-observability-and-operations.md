# Observability And Operations

Project: **Personal Task Manager** (`01-task-manager`)

## What Exists

- Health route or server startup around `server/src/app.js:1` and `server/src/server.js:10`.
- Error envelope around `server/src/middleware/errorMiddleware.js:1`.
- Dev logging if middleware such as Morgan is mounted in `server/src/app.js:1`.

## How Would I Know This Broke?

| Flow | Signal | Missing Signal To Consider |
| --- | --- | --- |
| API unavailable | health check fails | uptime alert |
| Validation bug | 400/500 responses | structured error count |
| Slow DB query | delayed API response | query duration logs |
| UI contract drift | browser console/network error | frontend error boundary |

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
