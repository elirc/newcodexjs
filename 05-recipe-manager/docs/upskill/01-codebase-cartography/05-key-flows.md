# Key Flows

Project: **Recipe Manager** (`05-recipe-manager`)

## Flow: List Records

**Why this flow matters:** The default read path teaches UI data fetching and unbounded-query risk.

**Open these files first:**
- `client/src/App.tsx:19` - inspect ownership at this step.
- `client/src/services/api.ts:4` - inspect ownership at this step.
- `server/src/routes/recipeRoutes.ts:1` - inspect ownership at this step.
- `server/src/services/recipeService.ts:17` - inspect ownership at this step.
- `server/src/models/recipeModel.ts:2` - inspect ownership at this step.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | UI/API | `client/src/App.tsx:19` | User or system action starts the flow. | form/query/input | stale state or missing validation |
| 2 | Transport | `client/src/services/api.ts:4` | HTTP contract carries the request. | JSON/envelope | contract drift |
| 3 | Domain | `server/src/routes/recipeRoutes.ts:1` | Rules are applied. | normalized payload | invariant gap |
| 4 | Persistence | `server/src/models/recipeModel.ts:2` | Database read/write happens. | table row(s) | unbounded query or transaction gap |

**Validation and authorization:** Validation should be visible around `server/src/services/recipeService.ts:17`. Authorization is limited or demo-oriented unless this project has auth-specific files.

**Persistence and side effects:** Persistence anchors are `server/src/models/recipeModel.ts:2` and `server/db/migrations/001_initial_schema.ts:5`. Side effects are intentionally minimal in Tier 1 unless the project introduces uploads, email, or external metadata.

**Tests that cover it:** No direct test coverage was confirmed in this docs pass. Add tests before relying on behavior in production.

**What juniors usually miss:** The UI shape and DB shape are allowed to differ; the API contract is the translation layer.

**What seniors notice:** Missing pagination, missing transaction boundaries, or weak authorization can become architectural debt.

**Drill:** Trace one field from input to database row and back to render.

**Self-grade:** Basic: names files. Solid: explains data transformation. Strong: identifies invariant, risk, and test.

## Flow: Create Record

**Why this flow matters:** The write path teaches validation, persistence, and response contracts.

**Open these files first:**
- `client/src/App.tsx:19` - inspect ownership at this step.
- `client/src/services/api.ts:4` - inspect ownership at this step.
- `server/src/controllers/recipeController.ts:6` - inspect ownership at this step.
- `server/src/services/recipeService.ts:17` - inspect ownership at this step.
- `server/src/models/recipeModel.ts:2` - inspect ownership at this step.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | UI/API | `client/src/App.tsx:19` | User or system action starts the flow. | form/query/input | stale state or missing validation |
| 2 | Transport | `client/src/services/api.ts:4` | HTTP contract carries the request. | JSON/envelope | contract drift |
| 3 | Domain | `server/src/controllers/recipeController.ts:6` | Rules are applied. | normalized payload | invariant gap |
| 4 | Persistence | `server/src/models/recipeModel.ts:2` | Database read/write happens. | table row(s) | unbounded query or transaction gap |

**Validation and authorization:** Validation should be visible around `server/src/services/recipeService.ts:17`. Authorization is limited or demo-oriented unless this project has auth-specific files.

**Persistence and side effects:** Persistence anchors are `server/src/models/recipeModel.ts:2` and `server/db/migrations/001_initial_schema.ts:5`. Side effects are intentionally minimal in Tier 1 unless the project introduces uploads, email, or external metadata.

**Tests that cover it:** No direct test coverage was confirmed in this docs pass. Add tests before relying on behavior in production.

**What juniors usually miss:** The UI shape and DB shape are allowed to differ; the API contract is the translation layer.

**What seniors notice:** Missing pagination, missing transaction boundaries, or weak authorization can become architectural debt.

**Drill:** Trace one field from input to database row and back to render.

**Self-grade:** Basic: names files. Solid: explains data transformation. Strong: identifies invariant, risk, and test.

## Flow: Update Record

**Why this flow matters:** Update flows teach partial changes, invariant preservation, and stale UI state.

**Open these files first:**
- `client/src/App.tsx:19` - inspect ownership at this step.
- `client/src/services/api.ts:4` - inspect ownership at this step.
- `server/src/controllers/recipeController.ts:6` - inspect ownership at this step.
- `server/src/services/recipeService.ts:17` - inspect ownership at this step.
- `server/src/models/recipeModel.ts:2` - inspect ownership at this step.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | UI/API | `client/src/App.tsx:19` | User or system action starts the flow. | form/query/input | stale state or missing validation |
| 2 | Transport | `client/src/services/api.ts:4` | HTTP contract carries the request. | JSON/envelope | contract drift |
| 3 | Domain | `server/src/controllers/recipeController.ts:6` | Rules are applied. | normalized payload | invariant gap |
| 4 | Persistence | `server/src/models/recipeModel.ts:2` | Database read/write happens. | table row(s) | unbounded query or transaction gap |

**Validation and authorization:** Validation should be visible around `server/src/services/recipeService.ts:17`. Authorization is limited or demo-oriented unless this project has auth-specific files.

**Persistence and side effects:** Persistence anchors are `server/src/models/recipeModel.ts:2` and `server/db/migrations/001_initial_schema.ts:5`. Side effects are intentionally minimal in Tier 1 unless the project introduces uploads, email, or external metadata.

**Tests that cover it:** No direct test coverage was confirmed in this docs pass. Add tests before relying on behavior in production.

**What juniors usually miss:** The UI shape and DB shape are allowed to differ; the API contract is the translation layer.

**What seniors notice:** Missing pagination, missing transaction boundaries, or weak authorization can become architectural debt.

**Drill:** Trace one field from input to database row and back to render.

**Self-grade:** Basic: names files. Solid: explains data transformation. Strong: identifies invariant, risk, and test.

## Flow: Delete Record

**Why this flow matters:** Delete flows teach destructive operations and confirmation UX.

**Open these files first:**
- `client/src/App.tsx:19` - inspect ownership at this step.
- `server/src/routes/recipeRoutes.ts:1` - inspect ownership at this step.
- `server/src/controllers/recipeController.ts:6` - inspect ownership at this step.
- `server/src/services/recipeService.ts:17` - inspect ownership at this step.
- `server/src/models/recipeModel.ts:2` - inspect ownership at this step.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | UI/API | `client/src/App.tsx:19` | User or system action starts the flow. | form/query/input | stale state or missing validation |
| 2 | Transport | `server/src/routes/recipeRoutes.ts:1` | HTTP contract carries the request. | JSON/envelope | contract drift |
| 3 | Domain | `server/src/controllers/recipeController.ts:6` | Rules are applied. | normalized payload | invariant gap |
| 4 | Persistence | `server/src/models/recipeModel.ts:2` | Database read/write happens. | table row(s) | unbounded query or transaction gap |

**Validation and authorization:** Validation should be visible around `server/src/services/recipeService.ts:17`. Authorization is limited or demo-oriented unless this project has auth-specific files.

**Persistence and side effects:** Persistence anchors are `server/src/models/recipeModel.ts:2` and `server/db/migrations/001_initial_schema.ts:5`. Side effects are intentionally minimal in Tier 1 unless the project introduces uploads, email, or external metadata.

**Tests that cover it:** No direct test coverage was confirmed in this docs pass. Add tests before relying on behavior in production.

**What juniors usually miss:** The UI shape and DB shape are allowed to differ; the API contract is the translation layer.

**What seniors notice:** Missing pagination, missing transaction boundaries, or weak authorization can become architectural debt.

**Drill:** Trace one field from input to database row and back to render.

**Self-grade:** Basic: names files. Solid: explains data transformation. Strong: identifies invariant, risk, and test.

## Flow: Database Setup

**Why this flow matters:** Migrations and seeds teach repeatable local state.

**Open these files first:**
- `server/knexfile.ts` - inspect ownership at this step.
- `server/db/migrations/001_initial_schema.ts:5` - inspect ownership at this step.
- `server/db/seeds/001_seed.ts:19` - inspect ownership at this step.
- `server/src/models/recipeModel.ts:2` - inspect ownership at this step.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | UI/API | `server/knexfile.ts` | User or system action starts the flow. | form/query/input | stale state or missing validation |
| 2 | Transport | `server/db/migrations/001_initial_schema.ts:5` | HTTP contract carries the request. | JSON/envelope | contract drift |
| 3 | Domain | `server/db/seeds/001_seed.ts:19` | Rules are applied. | normalized payload | invariant gap |
| 4 | Persistence | `server/src/models/recipeModel.ts:2` | Database read/write happens. | table row(s) | unbounded query or transaction gap |

**Validation and authorization:** Validation should be visible around `server/src/services/recipeService.ts:17`. Authorization is limited or demo-oriented unless this project has auth-specific files.

**Persistence and side effects:** Persistence anchors are `server/src/models/recipeModel.ts:2` and `server/db/migrations/001_initial_schema.ts:5`. Side effects are intentionally minimal in Tier 1 unless the project introduces uploads, email, or external metadata.

**Tests that cover it:** No direct test coverage was confirmed in this docs pass. Add tests before relying on behavior in production.

**What juniors usually miss:** The UI shape and DB shape are allowed to differ; the API contract is the translation layer.

**What seniors notice:** Missing pagination, missing transaction boundaries, or weak authorization can become architectural debt.

**Drill:** Trace one field from input to database row and back to render.

**Self-grade:** Basic: names files. Solid: explains data transformation. Strong: identifies invariant, risk, and test.

## Flow: Error Translation

**Why this flow matters:** Errors must become useful API envelopes without leaking internals.

**Open these files first:**
- `server/src/services/recipeService.ts:17` - inspect ownership at this step.
- `server/src/middleware/errorHandler.ts:2` - inspect ownership at this step.
- `server/src/app.ts:3` - inspect ownership at this step.

**Trace:**

| Step | Owner | File | What happens | Data shape | Risk |
| --- | --- | --- | --- | --- | --- |
| 1 | UI/API | `server/src/services/recipeService.ts:17` | User or system action starts the flow. | form/query/input | stale state or missing validation |
| 2 | Transport | `server/src/middleware/errorHandler.ts:2` | HTTP contract carries the request. | JSON/envelope | contract drift |
| 3 | Domain | `server/src/app.ts:3` | Rules are applied. | normalized payload | invariant gap |
| 4 | Persistence | `server/src/app.ts:3` | Database read/write happens. | table row(s) | unbounded query or transaction gap |

**Validation and authorization:** Validation should be visible around `server/src/services/recipeService.ts:17`. Authorization is limited or demo-oriented unless this project has auth-specific files.

**Persistence and side effects:** Persistence anchors are `server/src/models/recipeModel.ts:2` and `server/db/migrations/001_initial_schema.ts:5`. Side effects are intentionally minimal in Tier 1 unless the project introduces uploads, email, or external metadata.

**Tests that cover it:** No direct test coverage was confirmed in this docs pass. Add tests before relying on behavior in production.

**What juniors usually miss:** The UI shape and DB shape are allowed to differ; the API contract is the translation layer.

**What seniors notice:** Missing pagination, missing transaction boundaries, or weak authorization can become architectural debt.

**Drill:** Trace one field from input to database row and back to render.

**Self-grade:** Basic: names files. Solid: explains data transformation. Strong: identifies invariant, risk, and test.

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
