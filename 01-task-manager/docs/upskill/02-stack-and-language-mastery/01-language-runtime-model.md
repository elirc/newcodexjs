# Language Runtime Model

Project: **Personal Task Manager** (`01-task-manager`)

## Concept -> Code -> Drill

JavaScript and TypeScript run asynchronous work through promises and the event loop. In this repo, HTTP handlers and API calls use async functions so IO can complete without blocking the process.

**Why it matters:** serial awaits can add latency, missing awaits can hide errors, and unhandled promise failures can bypass the response envelope.

**Real code anchors:** `client/src/services/tasksApi.js:1`, `server/src/controllers/taskController.js:11`, `server/src/services/taskService.js:17`.

**Pitfalls:**
- Swallowing errors in API calls.
- Updating UI after a component unmounts.
- Mixing browser-only APIs into Node code.
- Using `any` so heavily that API contracts become invisible.

**Drill:** Find one async function and write down inputs, awaited work, thrown errors, and returned shape.

**Self-grade:** Strong answer names which layer owns retries, error translation, and user-visible messaging.

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
