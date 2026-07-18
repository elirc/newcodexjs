# Code Review Mindset

Project: **Personal Task Manager** (`01-task-manager`)

Review layers:

1. Does it work?
2. Is it correct for edge cases?
3. Will it stay correct?
4. Does it fit the codebase boundaries?
5. Is it kind to future maintainers?

Repo-specific checklist:
- UI behavior near `client/src/App.jsx:7`.
- HTTP contract near `client/src/services/tasksApi.js:1` and `server/src/routes/taskRoutes.js:5`.
- Business rules near `server/src/services/taskService.js:17`.
- Query shape near `server/src/models/taskModel.js:1`.
- Schema changes near `server/db/migrations/20260703000000_create_tasks_table.js:45`.

Good review language:
> Could we move this rule into the service so every API caller gets the same protection?

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
