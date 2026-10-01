# Learning Management System: lifecycle and bulk edits

> **Same lesson as [Team Project Management: lifecycle and bulk edits](../../16-team-project-management/astraupskill/README.md)** - this course is a near-identical rendering with different nouns. Do the canonical one; use this project only as a second, independent practice run.

This is a hands-on course for a junior software engineer using the actual project in `newcodexJS/18-learning-management-system`. The central skill is **preserving workflow state and atomic multi-record changes**. The implementation is already present: use it as a worked example, then recreate a small variation independently.

## What you will be able to do

- Explain the purpose of the changed code and the data it owns.
- Trace an action from input through validation, state/persistence and output.
- Predict a success case and a failure case before running either.
- Read the regression tests and explain what each assertion proves.
- Implement a related change without copying the worked answer.
- Explain a limitation and a reasonable next step without overstating readiness.

## Prerequisites

Be comfortable with variables, arrays, objects, functions, conditionals and calling a function. For React projects, review props, state and event handlers. For API projects, review JSON, HTTP methods and promises, then learn the relevant SQL operations as you trace the request. You do not need to memorize the whole repository first.

## Start the project

The root package.json is an npm workspace joining client and server. Install from the project root so test dependencies and sibling packages resolve consistently:

```powershell
npm install
$env:DATABASE_URL = 'postgres://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/astra_learning_sandbox'
npm run db:migrate
npm run db:seed
npm run dev
```

Create an empty, dedicated learning database before migrating. The seed command replaces sample tables, so use a disposable learning database. The DATABASE_URL environment variable must remain set in the terminal that starts the API. Vite prints the browser URL; the API is a separate process. The source README and server .env.example explain app-specific ports and optional settings. The new TypeScript database command runs through tsx, which loads the actual TypeScript migrations and seeds.

Use a separate pre-created test database for automated checks:

```powershell
$env:ASTRA_TEST_DATABASE_URL = 'postgres://postgres:YOUR_LOCAL_PASSWORD@localhost:5432/astra_test_learning'
npm test
npm run build
```

Tests create a random schema, run the real migrations, start the real HTTP API on a random loopback port, then close connections and drop that schema. The test database name must begin astra_test_ and the account needs schema creation rights. npm run build compiles the server and builds the React client. To start compiled API code, use npm run start --workspace server; this still needs DATABASE_URL and migrated tables. Client hosting is separate. Do not run seeds against valuable data.

The commands are run from this project’s folder, not from the Desktop inventory repository. Existing README/Fable material remains available. This folder teaches the implemented change and points to executable source and tests rather than replacing older guides.

### Toolchain

This course was delivered and verified on **Node 22.16.0**, **npm 10** and **PostgreSQL 18**. Use the same major versions: newer patch releases are fine, older majors are untested here.

Create the two databases once, from `psql`, as a user allowed to create databases and schemas:

```sql
CREATE DATABASE astra_learning_sandbox;   -- the development database
CREATE DATABASE astra_test_learning;      -- the automated-test database
```

`test/database.ts` refuses to run unless the database named in `ASTRA_TEST_DATABASE_URL` starts with `astra_test_`. It then creates one uniquely named schema per run and drops it at the end, so the development database is never a fixture.

`npm test` in the `server` package (run `npm test` from the project root, which delegates to it, or from `server`) runs `tsx --test ../test/*.test.ts`. npm runs scripts through `cmd.exe` on Windows, and `cmd.exe` does not expand the `../test/*.test.ts` glob; neither does PowerShell for a native command. Node's own test runner expands the pattern (Node 21+), so `npm test` works on Node 22 - but on an older Node, or with a different runner, you will see "no test files". The shell-independent equivalent is:

```powershell
cd server
npx tsx --test ../test/crud.test.ts
```

## Reading and practice order

1. [Codebase map and reading order](01-CODEBASE-MAP.md)
2. [Concepts explained from first principles](02-CONCEPTS.md)
3. [Worked implementation and examples](03-WORKED-CHANGE.md)
4. [Tests, failure cases and debugging](04-TESTING-AND-DEBUGGING.md)
5. [Guided and independent exercises](05-PRACTICE.md)
6. [Solutions, tradeoffs and review rubric](06-SOLUTIONS-AND-REVIEW.md)
7. [Detailed trace lab and independent checkpoint](07-TRACE-LAB.md)
8. [Actual verification results and limits](VERIFICATION.md)

## Your first session

1. Open the app or its tests and reproduce one normal workflow.
2. Read chapter 1 while keeping [server/src/models/model.ts](../server/src/models/model.ts) open.
3. Write a prediction for the worked example in chapter 3 before executing it.
4. Run the focused test suite and explain one assertion aloud.
5. Complete the first practice exercise, then check the solution discussion.

Keep a short learning log with four fields: prediction, observed result, explanation and next question. A mismatch is useful evidence: find the exact layer where your mental model diverged from the program. Use a disposable browser profile or local test database for failure experiments so your own records are not part of the fixture.

## Scope

Archive stores the previous status in an additive migration, restore returns to that status, and repeats are no-ops. Ordinary and bulk status changes keep archive flags consistent. Bulk IDs are deduplicated; all targets are locked and checked before any change. Audit rows contain real before/after records. List refreshes ignore stale responses and use the current filters after a mutation; failed saves retain the draft and show an error. This is one bounded improvement, not certification of every feature. Read VERIFICATION.md for checks actually executed. Exercises are intentionally future practice; do not confuse them with completed implementation.
