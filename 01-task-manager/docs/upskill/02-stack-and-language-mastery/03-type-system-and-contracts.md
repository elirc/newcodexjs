# Type System And Contracts

Project: **Personal Task Manager** (`01-task-manager`)

This project is JavaScript-based for early Tier 1 fundamentals.

## Contracts To Watch

- UI form shape: `client/src/App.jsx:7`.
- HTTP request/response shape: `client/src/services/tasksApi.js:1` and `server/src/routes/taskRoutes.js:5`.
- Domain payload shape: `server/src/services/taskService.js:17`.
- Database row shape: `server/db/migrations/20260703000000_create_tasks_table.js:45`.

## Junior Mistake

Treating the database row as the UI state. Better: let the API service normalize response shape so the UI is not coupled to persistence.

## Drill

Write a small contract table: field, source, validation owner, persistence column, display owner.

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
