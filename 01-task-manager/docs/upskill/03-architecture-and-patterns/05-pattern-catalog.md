# Pattern Catalog

Project: **Personal Task Manager** (`01-task-manager`)

## Pattern: Thin Controller

**Problem it solves:** Keeps transport concerns separate from business rules.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/src/controllers/taskController.js:11`

**Second example:** `server/src/routes/taskRoutes.js:5` or `server/src/models/taskModel.js:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Service Boundary

**Problem it solves:** Centralizes validation and invariants.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/src/services/taskService.js:17`

**Second example:** `server/src/routes/taskRoutes.js:5` or `server/src/models/taskModel.js:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Model Query Wrapper

**Problem it solves:** Keeps SQL/Knex out of UI and controllers.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/src/models/taskModel.js:1`

**Second example:** `server/src/routes/taskRoutes.js:5` or `server/src/models/taskModel.js:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Standard Response Envelope

**Problem it solves:** Makes API success and failure predictable.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/src/controllers/taskController.js:11`

**Second example:** `server/src/routes/taskRoutes.js:5` or `server/src/models/taskModel.js:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Migration As Contract

**Problem it solves:** Treats schema as versioned architecture.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/db/migrations/20260703000000_create_tasks_table.js:45`

**Second example:** `server/src/routes/taskRoutes.js:5` or `server/src/models/taskModel.js:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Seed Data As Scenario

**Problem it solves:** Provides realistic states for learning and debugging.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/db/seeds/01_tasks.js:136`

**Second example:** `server/src/routes/taskRoutes.js:5` or `server/src/models/taskModel.js:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Client API Wrapper

**Problem it solves:** Avoids scattering URLs across components.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `client/src/services/tasksApi.js:1`

**Second example:** `server/src/routes/taskRoutes.js:5` or `server/src/models/taskModel.js:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Environment Boundary

**Problem it solves:** Keeps local config out of source code.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/src/config/env.js:14`

**Second example:** `server/src/routes/taskRoutes.js:5` or `server/src/models/taskModel.js:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Error Translation Middleware

**Problem it solves:** Turns thrown errors into HTTP responses.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/src/middleware/errorMiddleware.js:1`

**Second example:** `server/src/routes/taskRoutes.js:5` or `server/src/models/taskModel.js:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Feature-First UI

**Problem it solves:** Keeps domain components near their behavior.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `client/src/App.jsx:7`

**Second example:** `server/src/routes/taskRoutes.js:5` or `server/src/models/taskModel.js:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Validation Before Persistence

**Problem it solves:** Rejects bad input before durable writes.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/src/services/taskService.js:17`

**Second example:** `server/src/routes/taskRoutes.js:5` or `server/src/models/taskModel.js:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Small Blast Radius Change

**Problem it solves:** Modifies one layer at a time unless the contract changes.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `client/src/App.jsx:7`

**Second example:** `server/src/routes/taskRoutes.js:5` or `server/src/models/taskModel.js:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
