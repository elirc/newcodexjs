# Boundaries And Layers

Project: **Personal Task Manager** (`01-task-manager`)

| Layer | Owns | Must Not Own | Anchor |
| --- | --- | --- | --- |
| UI | rendering, local interaction | SQL, secrets | `client/src/App.jsx:7` |
| Client API | HTTP contract | domain rules | `client/src/services/tasksApi.js:1` |
| Routes | paths and verbs | business branching | `server/src/routes/taskRoutes.js:5` |
| Controllers | parsing and envelopes | persistence details | `server/src/controllers/taskController.js:11` |
| Services | validation and invariants | raw HTTP concerns | `server/src/services/taskService.js:17` |
| Models | Knex queries | UI decisions | `server/src/models/taskModel.js:1` |
| Migrations | durable schema | request logic | `server/db/migrations/20260703000000_create_tasks_table.js:45` |

Boundary leak to investigate: any validation duplicated inconsistently between UI and service.

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
