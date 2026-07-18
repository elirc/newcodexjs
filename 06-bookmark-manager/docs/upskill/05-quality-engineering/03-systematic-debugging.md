# Systematic Debugging

Project: **Bookmark Manager** (`06-bookmark-manager`)

## Scenario: List is empty after seed

**Reproduction:** Run the relevant dev servers and trigger the bookmark flow.

**First question:** Is the bug in UI, API contract, service logic, or persistence?

**Narrowing path:**
1. Check browser network around `client/src/services/api.ts:4`.
2. Check route registration around `server/src/routes/routes.ts:4`.
3. Check service branching around `server/src/services/service.ts:5`.
4. Check query/schema around `server/src/models/model.ts:1` and `server/db/migrations/001_init.ts:4`.

**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.

**Regression test to add:** one API integration test for the failing branch.

**Senior lesson:** narrow cheaply before rewriting code.

## Scenario: Create returns 500

**Reproduction:** Run the relevant dev servers and trigger the bookmark flow.

**First question:** Is the bug in UI, API contract, service logic, or persistence?

**Narrowing path:**
1. Check browser network around `client/src/services/api.ts:4`.
2. Check route registration around `server/src/routes/routes.ts:4`.
3. Check service branching around `server/src/services/service.ts:5`.
4. Check query/schema around `server/src/models/model.ts:1` and `server/db/migrations/001_init.ts:4`.

**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.

**Regression test to add:** one API integration test for the failing branch.

**Senior lesson:** narrow cheaply before rewriting code.

## Scenario: UI shows stale data

**Reproduction:** Run the relevant dev servers and trigger the bookmark flow.

**First question:** Is the bug in UI, API contract, service logic, or persistence?

**Narrowing path:**
1. Check browser network around `client/src/services/api.ts:4`.
2. Check route registration around `server/src/routes/routes.ts:4`.
3. Check service branching around `server/src/services/service.ts:5`.
4. Check query/schema around `server/src/models/model.ts:1` and `server/db/migrations/001_init.ts:4`.

**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.

**Regression test to add:** one API integration test for the failing branch.

**Senior lesson:** narrow cheaply before rewriting code.

## Scenario: Migration fails locally

**Reproduction:** Run the relevant dev servers and trigger the bookmark flow.

**First question:** Is the bug in UI, API contract, service logic, or persistence?

**Narrowing path:**
1. Check browser network around `client/src/services/api.ts:4`.
2. Check route registration around `server/src/routes/routes.ts:4`.
3. Check service branching around `server/src/services/service.ts:5`.
4. Check query/schema around `server/src/models/model.ts:1` and `server/db/migrations/001_init.ts:4`.

**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.

**Regression test to add:** one API integration test for the failing branch.

**Senior lesson:** narrow cheaply before rewriting code.

## Scenario: Build passes but runtime API call fails

**Reproduction:** Run the relevant dev servers and trigger the bookmark flow.

**First question:** Is the bug in UI, API contract, service logic, or persistence?

**Narrowing path:**
1. Check browser network around `client/src/services/api.ts:4`.
2. Check route registration around `server/src/routes/routes.ts:4`.
3. Check service branching around `server/src/services/service.ts:5`.
4. Check query/schema around `server/src/models/model.ts:1` and `server/db/migrations/001_init.ts:4`.

**Useful probes:** console log request payload, inspect response envelope, enable query logging, run migration/seed commands.

**Regression test to add:** one API integration test for the failing branch.

**Senior lesson:** narrow cheaply before rewriting code.

## Verification Notes

- Generated from inspected files in `06-bookmark-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
