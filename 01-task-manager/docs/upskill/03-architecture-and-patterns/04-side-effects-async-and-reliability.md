# Side Effects, Async, And Reliability

Project: **Personal Task Manager** (`01-task-manager`)

Side effects in Tier 1 are intentionally limited, but the project may include email, uploads, metadata fetches, CSV export, or reporting.

## Reliability Concepts

- Idempotency: retrying should not duplicate records.
- Timeout: external calls should not hang request workers forever.
- Backpressure: expensive flows should avoid unbounded work.
- Visibility: failures should be logged and returned through the error envelope.

## Inspect

- API side effects near `server/src/services/taskService.js:17`.
- Persistence writes near `server/src/models/taskModel.js:1`.
- Error translation near `server/src/middleware/errorMiddleware.js:1`.

## Drill

Pick one write flow. Ask: if the database write succeeds but the UI refresh fails, what state does the user see?

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
