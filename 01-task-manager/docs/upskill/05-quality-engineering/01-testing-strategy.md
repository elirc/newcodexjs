# Testing Strategy

Project: **Personal Task Manager** (`01-task-manager`)

## Layers

| Layer | What belongs here | Anchor |
| --- | --- | --- |
| Unit | pure helpers and service branches | `server/src/services/taskService.js:17` |
| API integration | route/controller/service/model contract | `server/src/routes/taskRoutes.js:5` |
| DB/migration | schema constraints and seed assumptions | `server/db/migrations/20260703000000_create_tasks_table.js:45` |
| UI | state, forms, rendering, error states | `client/src/App.jsx:7` |
| Contract/type | request and response shapes | `client/src/services/tasksApi.js:1` |

## What Not To Test

Do not assert implementation details like internal hook state unless behavior requires it. Do test user-visible behavior and API contracts.

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
