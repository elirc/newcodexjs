# Systematic Debugging

Project: **Recipe Manager** (`05-recipe-manager`)

## Scenario: List is empty after seed

**Reproduction:** Run the relevant dev servers and trigger the user flow.

**First question:** Is the bug in UI, API contract, service logic, or persistence?

**Narrowing path:**
1. Check browser network around `client/src/services/api.ts:4`.
2. Check route registration around `server/src/routes/recipeRoutes.ts:1`.
3. Check service branching around `server/src/services/recipeService.ts:17`.
4. Check query/schema around `server/src/models/recipeModel.ts:2` and `server/db/migrations/001_initial_schema.ts:5`.

**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.

**Regression test to add:** one API integration test for the failing branch.

**Senior lesson:** narrow cheaply before rewriting code.

## Scenario: Create returns 500

**Reproduction:** Run the relevant dev servers and trigger the user flow.

**First question:** Is the bug in UI, API contract, service logic, or persistence?

**Narrowing path:**
1. Check browser network around `client/src/services/api.ts:4`.
2. Check route registration around `server/src/routes/recipeRoutes.ts:1`.
3. Check service branching around `server/src/services/recipeService.ts:17`.
4. Check query/schema around `server/src/models/recipeModel.ts:2` and `server/db/migrations/001_initial_schema.ts:5`.

**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.

**Regression test to add:** one API integration test for the failing branch.

**Senior lesson:** narrow cheaply before rewriting code.

## Scenario: UI shows stale data

**Reproduction:** Run the relevant dev servers and trigger the user flow.

**First question:** Is the bug in UI, API contract, service logic, or persistence?

**Narrowing path:**
1. Check browser network around `client/src/services/api.ts:4`.
2. Check route registration around `server/src/routes/recipeRoutes.ts:1`.
3. Check service branching around `server/src/services/recipeService.ts:17`.
4. Check query/schema around `server/src/models/recipeModel.ts:2` and `server/db/migrations/001_initial_schema.ts:5`.

**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.

**Regression test to add:** one API integration test for the failing branch.

**Senior lesson:** narrow cheaply before rewriting code.

## Scenario: Migration fails locally

**Reproduction:** Run the relevant dev servers and trigger the user flow.

**First question:** Is the bug in UI, API contract, service logic, or persistence?

**Narrowing path:**
1. Check browser network around `client/src/services/api.ts:4`.
2. Check route registration around `server/src/routes/recipeRoutes.ts:1`.
3. Check service branching around `server/src/services/recipeService.ts:17`.
4. Check query/schema around `server/src/models/recipeModel.ts:2` and `server/db/migrations/001_initial_schema.ts:5`.

**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.

**Regression test to add:** one API integration test for the failing branch.

**Senior lesson:** narrow cheaply before rewriting code.

## Scenario: Build passes but runtime API call fails

**Reproduction:** Run the relevant dev servers and trigger the user flow.

**First question:** Is the bug in UI, API contract, service logic, or persistence?

**Narrowing path:**
1. Check browser network around `client/src/services/api.ts:4`.
2. Check route registration around `server/src/routes/recipeRoutes.ts:1`.
3. Check service branching around `server/src/services/recipeService.ts:17`.
4. Check query/schema around `server/src/models/recipeModel.ts:2` and `server/db/migrations/001_initial_schema.ts:5`.

**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.

**Regression test to add:** one API integration test for the failing branch.

**Senior lesson:** narrow cheaply before rewriting code.

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
