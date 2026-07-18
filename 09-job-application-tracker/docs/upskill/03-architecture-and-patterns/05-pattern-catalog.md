# Pattern Catalog

Project: **Job Application Tracker** (`09-job-application-tracker`)

## Pattern: Thin Controller

**Problem it solves:** Keeps transport concerns separate from business rules.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/src/controllers/controller.ts:6`

**Second example:** `server/src/routes/routes.ts:4` or `server/src/models/model.ts:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Service Boundary

**Problem it solves:** Centralizes validation and invariants.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/src/services/service.ts:5`

**Second example:** `server/src/routes/routes.ts:4` or `server/src/models/model.ts:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Model Query Wrapper

**Problem it solves:** Keeps SQL/Knex out of UI and controllers.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/src/models/model.ts:1`

**Second example:** `server/src/routes/routes.ts:4` or `server/src/models/model.ts:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Standard Response Envelope

**Problem it solves:** Makes API success and failure predictable.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/src/controllers/controller.ts:6`

**Second example:** `server/src/routes/routes.ts:4` or `server/src/models/model.ts:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Migration As Contract

**Problem it solves:** Treats schema as versioned architecture.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/db/migrations/001_init.ts:4`

**Second example:** `server/src/routes/routes.ts:4` or `server/src/models/model.ts:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Seed Data As Scenario

**Problem it solves:** Provides realistic states for learning and debugging.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/db/seeds/001_seed.ts:5`

**Second example:** `server/src/routes/routes.ts:4` or `server/src/models/model.ts:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Client API Wrapper

**Problem it solves:** Avoids scattering URLs across components.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `client/src/services/api.ts:4`

**Second example:** `server/src/routes/routes.ts:4` or `server/src/models/model.ts:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Environment Boundary

**Problem it solves:** Keeps local config out of source code.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/src/config/env.ts:8`

**Second example:** `server/src/routes/routes.ts:4` or `server/src/models/model.ts:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Error Translation Middleware

**Problem it solves:** Turns thrown errors into HTTP responses.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/src/middleware/errorMiddleware.ts:2`

**Second example:** `server/src/routes/routes.ts:4` or `server/src/models/model.ts:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Feature-First UI

**Problem it solves:** Keeps domain components near their behavior.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `client/src/App.tsx:17`

**Second example:** `server/src/routes/routes.ts:4` or `server/src/models/model.ts:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Validation Before Persistence

**Problem it solves:** Rejects bad input before durable writes.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `server/src/services/service.ts:5`

**Second example:** `server/src/routes/routes.ts:4` or `server/src/models/model.ts:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Pattern: Small Blast Radius Change

**Problem it solves:** Modifies one layer at a time unless the contract changes.

**General shape:** Put one responsibility behind a clear boundary and make callers use that boundary.

**Real example:** `client/src/App.tsx:17`

**Second example:** `server/src/routes/routes.ts:4` or `server/src/models/model.ts:1`, depending on the pattern.

**Why this implementation works:** It lets a learner trace ownership without guessing where logic belongs.

**Failure modes:** Boundary drift, duplicated rules, hidden coupling, and tests that only cover happy paths.

**Use it when:** the concept has a stable owner.

**Avoid it when:** the abstraction hides one-off complexity without reducing risk.

**Drill:** Find another instance and explain its inputs, outputs, invariant, and failure mode.

## Verification Notes

- Generated from inspected files in `09-job-application-tracker`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
