# Data Model And Persistence

Project: **Personal Task Manager** (`01-task-manager`)

The durable model starts at `server/db/migrations/20260703000000_create_tasks_table.js:45`; local learning data starts at `server/db/seeds/01_tasks.js:136`; runtime queries are concentrated around `server/src/models/taskModel.js:1`.

## Schema Change Checklist

1. Add reversible migration.
2. Update seed data.
3. Update service validation.
4. Update client API and UI display.
5. Add regression tests or at least a manual verification note.
6. Think about rollback: can old code tolerate the new column?

## Transaction Thinking

If one user action writes multiple tables, the service should own a transaction boundary and the model should accept a transaction object. Investigate this before adding multi-step writes.

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
