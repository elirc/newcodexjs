# System Map

Project: **Personal Task Manager** (`01-task-manager`)

```text
client React UI
  -> client API service
  -> Express app/routes
  -> controller
  -> service/business rules
  -> model/Knex
  -> PostgreSQL tables + seed data
```

| Area | Owner | Anchor | Public or Private |
| --- | --- | --- | --- |
| UI | React page/components | `client/src/App.jsx:7` | Public user surface |
| Client API | HTTP contract wrapper | `client/src/services/tasksApi.js:1` | Internal client boundary |
| API app | middleware, health, route mount | `server/src/app.js:1` | Public HTTP surface |
| Routes | method/path contract | `server/src/routes/taskRoutes.js:5` | Public API contract |
| Controller | envelope and request parsing | `server/src/controllers/taskController.js:11` | Internal transport boundary |
| Service | invariants and business rules | `server/src/services/taskService.js:17` | Domain boundary |
| Model | Knex queries | `server/src/models/taskModel.js:1` | Persistence boundary |
| Data | migrations and seeds | `server/db/migrations/20260703000000_create_tasks_table.js:45`, `server/db/seeds/01_tasks.js:136` | Database contract |

Public interfaces are the browser UI and API routes. Private internals are service/model implementations, migration details, and UI state helpers.

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
