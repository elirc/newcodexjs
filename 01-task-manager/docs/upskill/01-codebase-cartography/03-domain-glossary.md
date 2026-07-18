# Domain Glossary

Project: **Personal Task Manager** (`01-task-manager`)

## task

Meaning in this project: a core domain term used to reason about task CRUD, filtering, completion toggles, overdue highlighting.

Where to look:
- `client/src/App.jsx` for user-facing behavior.
- `server/src/services/taskService.js` for rules involving task.
- `server/db/migrations/20260703000000_create_tasks_table.js` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## priority

Meaning in this project: a core domain term used to reason about task CRUD, filtering, completion toggles, overdue highlighting.

Where to look:
- `client/src/App.jsx` for user-facing behavior.
- `server/src/services/taskService.js` for rules involving priority.
- `server/db/migrations/20260703000000_create_tasks_table.js` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## status

Meaning in this project: a core domain term used to reason about task CRUD, filtering, completion toggles, overdue highlighting.

Where to look:
- `client/src/App.jsx` for user-facing behavior.
- `server/src/services/taskService.js` for rules involving status.
- `server/db/migrations/20260703000000_create_tasks_table.js` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## due date

Meaning in this project: a core domain term used to reason about task CRUD, filtering, completion toggles, overdue highlighting.

Where to look:
- `client/src/App.jsx` for user-facing behavior.
- `server/src/services/taskService.js` for rules involving due date.
- `server/db/migrations/20260703000000_create_tasks_table.js` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## completed_at

Meaning in this project: a core domain term used to reason about task CRUD, filtering, completion toggles, overdue highlighting.

Where to look:
- `client/src/App.jsx` for user-facing behavior.
- `server/src/services/taskService.js` for rules involving completed_at.
- `server/db/migrations/20260703000000_create_tasks_table.js` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
