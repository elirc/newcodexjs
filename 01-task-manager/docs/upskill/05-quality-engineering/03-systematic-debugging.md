# Systematic Debugging

Project: **Personal Task Manager** (`01-task-manager`)

## Scenario: List is empty after seed

**Reproduction:** Run the relevant dev servers and trigger the task flow.

**First question:** Is the bug in UI, API contract, service logic, or persistence?

**Narrowing path:**
1. Check browser network around `client/src/services/tasksApi.js:1`.
2. Check route registration around `server/src/routes/taskRoutes.js:5`.
3. Check service branching around `server/src/services/taskService.js:17`.
4. Check query/schema around `server/src/models/taskModel.js:1` and `server/db/migrations/20260703000000_create_tasks_table.js:45`.

**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.

**Regression test to add:** one API integration test for the failing branch.

**Senior lesson:** narrow cheaply before rewriting code.

## Scenario: Create returns 500

**Reproduction:** Run the relevant dev servers and trigger the task flow.

**First question:** Is the bug in UI, API contract, service logic, or persistence?

**Narrowing path:**
1. Check browser network around `client/src/services/tasksApi.js:1`.
2. Check route registration around `server/src/routes/taskRoutes.js:5`.
3. Check service branching around `server/src/services/taskService.js:17`.
4. Check query/schema around `server/src/models/taskModel.js:1` and `server/db/migrations/20260703000000_create_tasks_table.js:45`.

**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.

**Regression test to add:** one API integration test for the failing branch.

**Senior lesson:** narrow cheaply before rewriting code.

## Scenario: UI shows stale data

**Reproduction:** Run the relevant dev servers and trigger the task flow.

**First question:** Is the bug in UI, API contract, service logic, or persistence?

**Narrowing path:**
1. Check browser network around `client/src/services/tasksApi.js:1`.
2. Check route registration around `server/src/routes/taskRoutes.js:5`.
3. Check service branching around `server/src/services/taskService.js:17`.
4. Check query/schema around `server/src/models/taskModel.js:1` and `server/db/migrations/20260703000000_create_tasks_table.js:45`.

**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.

**Regression test to add:** one API integration test for the failing branch.

**Senior lesson:** narrow cheaply before rewriting code.

## Scenario: Migration fails locally

**Reproduction:** Run the relevant dev servers and trigger the task flow.

**First question:** Is the bug in UI, API contract, service logic, or persistence?

**Narrowing path:**
1. Check browser network around `client/src/services/tasksApi.js:1`.
2. Check route registration around `server/src/routes/taskRoutes.js:5`.
3. Check service branching around `server/src/services/taskService.js:17`.
4. Check query/schema around `server/src/models/taskModel.js:1` and `server/db/migrations/20260703000000_create_tasks_table.js:45`.

**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.

**Regression test to add:** one API integration test for the failing branch.

**Senior lesson:** narrow cheaply before rewriting code.

## Scenario: Build passes but runtime API call fails

**Reproduction:** Run the relevant dev servers and trigger the task flow.

**First question:** Is the bug in UI, API contract, service logic, or persistence?

**Narrowing path:**
1. Check browser network around `client/src/services/tasksApi.js:1`.
2. Check route registration around `server/src/routes/taskRoutes.js:5`.
3. Check service branching around `server/src/services/taskService.js:17`.
4. Check query/schema around `server/src/models/taskModel.js:1` and `server/db/migrations/20260703000000_create_tasks_table.js:45`.

**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.

**Regression test to add:** one API integration test for the failing branch.

**Senior lesson:** narrow cheaply before rewriting code.

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
