# Key Flows

Project: **Personal Task Manager** (`01-task-manager`)

## Flow: List Records

**Why this flow matters:** The default read path teaches UI data fetching and unbounded-query risk.

**Open these files first:**
- `client/src/App.jsx:7` - inspect ownership at this step.
- `client/src/services/tasksApi.js:1` - inspect ownership at this step.
- `server/src/routes/taskRoutes.js:5` - inspect ownership at this step.
- `server/src/services/taskService.js:17` - inspect ownership at this step.
- `server/src/models/taskModel.js:1` - inspect ownership at this step.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | UI/API | `client/src/App.jsx:7` | User or system action starts the flow. | form/query/input | stale state or missing validation |
| 2 | Transport | `client/src/services/tasksApi.js:1` | HTTP contract carries the request. | JSON/envelope | contract drift |
| 3 | Domain | `server/src/routes/taskRoutes.js:5` | Rules are applied. | normalized payload | invariant gap |
| 4 | Persistence | `server/src/models/taskModel.js:1` | Database read/write happens. | table row(s) | unbounded query or transaction gap |

**Validation and authorization:** Validation should be visible around `server/src/services/taskService.js:17`. Authorization is limited or demo-oriented unless this project has auth-specific files.

**Persistence and side effects:** Persistence anchors are `server/src/models/taskModel.js:1` and `server/db/migrations/20260703000000_create_tasks_table.js:45`. Side effects are intentionally minimal in Tier 1 unless the project introduces uploads, email, or external metadata.

**Tests that cover it:** No direct test coverage was confirmed in this docs pass. Add tests before relying on behavior in production.

**What juniors usually miss:** The UI shape and DB shape are allowed to differ; the API contract is the translation layer.

**What seniors notice:** Missing pagination, missing transaction boundaries, or weak authorization can become architectural debt.

**Drill:** Trace one field from input to database row and back to render.

**Self-grade:** Basic: names files. Solid: explains data transformation. Strong: identifies invariant, risk, and test.

## Flow: Create Record

**Why this flow matters:** The write path teaches validation, persistence, and response contracts.

**Open these files first:**
- `client/src/App.jsx:7` - inspect ownership at this step.
- `client/src/services/tasksApi.js:1` - inspect ownership at this step.
- `server/src/controllers/taskController.js:11` - inspect ownership at this step.
- `server/src/services/taskService.js:17` - inspect ownership at this step.
- `server/src/models/taskModel.js:1` - inspect ownership at this step.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | UI/API | `client/src/App.jsx:7` | User or system action starts the flow. | form/query/input | stale state or missing validation |
| 2 | Transport | `client/src/services/tasksApi.js:1` | HTTP contract carries the request. | JSON/envelope | contract drift |
| 3 | Domain | `server/src/controllers/taskController.js:11` | Rules are applied. | normalized payload | invariant gap |
| 4 | Persistence | `server/src/models/taskModel.js:1` | Database read/write happens. | table row(s) | unbounded query or transaction gap |

**Validation and authorization:** Validation should be visible around `server/src/services/taskService.js:17`. Authorization is limited or demo-oriented unless this project has auth-specific files.

**Persistence and side effects:** Persistence anchors are `server/src/models/taskModel.js:1` and `server/db/migrations/20260703000000_create_tasks_table.js:45`. Side effects are intentionally minimal in Tier 1 unless the project introduces uploads, email, or external metadata.

**Tests that cover it:** No direct test coverage was confirmed in this docs pass. Add tests before relying on behavior in production.

**What juniors usually miss:** The UI shape and DB shape are allowed to differ; the API contract is the translation layer.

**What seniors notice:** Missing pagination, missing transaction boundaries, or weak authorization can become architectural debt.

**Drill:** Trace one field from input to database row and back to render.

**Self-grade:** Basic: names files. Solid: explains data transformation. Strong: identifies invariant, risk, and test.

## Flow: Update Record

**Why this flow matters:** Update flows teach partial changes, invariant preservation, and stale UI state.

**Open these files first:**
- `client/src/App.jsx:7` - inspect ownership at this step.
- `client/src/services/tasksApi.js:1` - inspect ownership at this step.
- `server/src/controllers/taskController.js:11` - inspect ownership at this step.
- `server/src/services/taskService.js:17` - inspect ownership at this step.
- `server/src/models/taskModel.js:1` - inspect ownership at this step.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | UI/API | `client/src/App.jsx:7` | User or system action starts the flow. | form/query/input | stale state or missing validation |
| 2 | Transport | `client/src/services/tasksApi.js:1` | HTTP contract carries the request. | JSON/envelope | contract drift |
| 3 | Domain | `server/src/controllers/taskController.js:11` | Rules are applied. | normalized payload | invariant gap |
| 4 | Persistence | `server/src/models/taskModel.js:1` | Database read/write happens. | table row(s) | unbounded query or transaction gap |

**Validation and authorization:** Validation should be visible around `server/src/services/taskService.js:17`. Authorization is limited or demo-oriented unless this project has auth-specific files.

**Persistence and side effects:** Persistence anchors are `server/src/models/taskModel.js:1` and `server/db/migrations/20260703000000_create_tasks_table.js:45`. Side effects are intentionally minimal in Tier 1 unless the project introduces uploads, email, or external metadata.

**Tests that cover it:** No direct test coverage was confirmed in this docs pass. Add tests before relying on behavior in production.

**What juniors usually miss:** The UI shape and DB shape are allowed to differ; the API contract is the translation layer.

**What seniors notice:** Missing pagination, missing transaction boundaries, or weak authorization can become architectural debt.

**Drill:** Trace one field from input to database row and back to render.

**Self-grade:** Basic: names files. Solid: explains data transformation. Strong: identifies invariant, risk, and test.

## Flow: Delete Record

**Why this flow matters:** Delete flows teach destructive operations and confirmation UX.

**Open these files first:**
- `client/src/App.jsx:7` - inspect ownership at this step.
- `server/src/routes/taskRoutes.js:5` - inspect ownership at this step.
- `server/src/controllers/taskController.js:11` - inspect ownership at this step.
- `server/src/services/taskService.js:17` - inspect ownership at this step.
- `server/src/models/taskModel.js:1` - inspect ownership at this step.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | UI/API | `client/src/App.jsx:7` | User or system action starts the flow. | form/query/input | stale state or missing validation |
| 2 | Transport | `server/src/routes/taskRoutes.js:5` | HTTP contract carries the request. | JSON/envelope | contract drift |
| 3 | Domain | `server/src/controllers/taskController.js:11` | Rules are applied. | normalized payload | invariant gap |
| 4 | Persistence | `server/src/models/taskModel.js:1` | Database read/write happens. | table row(s) | unbounded query or transaction gap |

**Validation and authorization:** Validation should be visible around `server/src/services/taskService.js:17`. Authorization is limited or demo-oriented unless this project has auth-specific files.

**Persistence and side effects:** Persistence anchors are `server/src/models/taskModel.js:1` and `server/db/migrations/20260703000000_create_tasks_table.js:45`. Side effects are intentionally minimal in Tier 1 unless the project introduces uploads, email, or external metadata.

**Tests that cover it:** No direct test coverage was confirmed in this docs pass. Add tests before relying on behavior in production.

**What juniors usually miss:** The UI shape and DB shape are allowed to differ; the API contract is the translation layer.

**What seniors notice:** Missing pagination, missing transaction boundaries, or weak authorization can become architectural debt.

**Drill:** Trace one field from input to database row and back to render.

**Self-grade:** Basic: names files. Solid: explains data transformation. Strong: identifies invariant, risk, and test.

## Flow: Database Setup

**Why this flow matters:** Migrations and seeds teach repeatable local state.

**Open these files first:**
- `server/knexfile.js` - inspect ownership at this step.
- `server/db/migrations/20260703000000_create_tasks_table.js:45` - inspect ownership at this step.
- `server/db/seeds/01_tasks.js:136` - inspect ownership at this step.
- `server/src/models/taskModel.js:1` - inspect ownership at this step.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | UI/API | `server/knexfile.js` | User or system action starts the flow. | form/query/input | stale state or missing validation |
| 2 | Transport | `server/db/migrations/20260703000000_create_tasks_table.js:45` | HTTP contract carries the request. | JSON/envelope | contract drift |
| 3 | Domain | `server/db/seeds/01_tasks.js:136` | Rules are applied. | normalized payload | invariant gap |
| 4 | Persistence | `server/src/models/taskModel.js:1` | Database read/write happens. | table row(s) | unbounded query or transaction gap |

**Validation and authorization:** Validation should be visible around `server/src/services/taskService.js:17`. Authorization is limited or demo-oriented unless this project has auth-specific files.

**Persistence and side effects:** Persistence anchors are `server/src/models/taskModel.js:1` and `server/db/migrations/20260703000000_create_tasks_table.js:45`. Side effects are intentionally minimal in Tier 1 unless the project introduces uploads, email, or external metadata.

**Tests that cover it:** No direct test coverage was confirmed in this docs pass. Add tests before relying on behavior in production.

**What juniors usually miss:** The UI shape and DB shape are allowed to differ; the API contract is the translation layer.

**What seniors notice:** Missing pagination, missing transaction boundaries, or weak authorization can become architectural debt.

**Drill:** Trace one field from input to database row and back to render.

**Self-grade:** Basic: names files. Solid: explains data transformation. Strong: identifies invariant, risk, and test.

## Flow: Error Translation

**Why this flow matters:** Errors must become useful API envelopes without leaking internals.

**Open these files first:**
- `server/src/services/taskService.js:17` - inspect ownership at this step.
- `server/src/middleware/errorMiddleware.js:1` - inspect ownership at this step.
- `server/src/app.js:1` - inspect ownership at this step.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | UI/API | `server/src/services/taskService.js:17` | User or system action starts the flow. | form/query/input | stale state or missing validation |
| 2 | Transport | `server/src/middleware/errorMiddleware.js:1` | HTTP contract carries the request. | JSON/envelope | contract drift |
| 3 | Domain | `server/src/app.js:1` | Rules are applied. | normalized payload | invariant gap |
| 4 | Persistence | `server/src/app.js:1` | Database read/write happens. | table row(s) | unbounded query or transaction gap |

**Validation and authorization:** Validation should be visible around `server/src/services/taskService.js:17`. Authorization is limited or demo-oriented unless this project has auth-specific files.

**Persistence and side effects:** Persistence anchors are `server/src/models/taskModel.js:1` and `server/db/migrations/20260703000000_create_tasks_table.js:45`. Side effects are intentionally minimal in Tier 1 unless the project introduces uploads, email, or external metadata.

**Tests that cover it:** No direct test coverage was confirmed in this docs pass. Add tests before relying on behavior in production.

**What juniors usually miss:** The UI shape and DB shape are allowed to differ; the API contract is the translation layer.

**What seniors notice:** Missing pagination, missing transaction boundaries, or weak authorization can become architectural debt.

**Drill:** Trace one field from input to database row and back to render.

**Self-grade:** Basic: names files. Solid: explains data transformation. Strong: identifies invariant, risk, and test.

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
