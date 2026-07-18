# Refactor And Design Katas

Project: **Personal Task Manager** (`01-task-manager`)

- Identify a boundary leak between `server/src/controllers/taskController.js:11` and `server/src/services/taskService.js:17`.
- Propose a transaction boundary for a multi-write flow.
- Split a large UI component without changing behavior.
- Improve type safety around `client/src/services/tasksApi.js:1`.
- Add pagination without breaking existing clients.
- Reduce a hypothetical N+1 query in `server/src/models/taskModel.js:1`.
- Write an RFC for auth/ownership.
- Review a fake PR that changes `server/db/migrations/20260703000000_create_tasks_table.js:45` without rollback notes.

Self-grade: strong answers name blast radius, migration path, test plan, and rollback.

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
