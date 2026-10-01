# Bookmark Manager: validated links and metadata

This is a hands-on course for a junior software engineer using the actual project in `newcodexJS/06-bookmark-manager`. The central skill is **runtime schemas, outbound policy and controlled network tests**. The implementation is already present: use it as a worked example, then recreate a small variation independently.

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

Install dependencies in server and client separately. Follow the root README and .env.example for your development database. Run API scripts from server and frontend scripts from client. Tests require ASTRA_TEST_DATABASE_URL pointing at a dedicated astra_test_* database; they create an isolated schema rather than use development records. Metadata is disabled until BOOKMARK_METADATA_HOSTS contains exact HTTPS hostnames. Manual bookmark creation needs no metadata configuration. Verification used only a controlled local stub.

The commands are run from this project’s folder, not from the Desktop inventory repository. Existing README/Fable material remains available. This folder teaches the implemented change and points to executable source and tests rather than replacing older guides.

### Toolchain

This course was delivered and verified on **Node 22.16.0**, **npm 10** and **PostgreSQL 18**. Use the same major versions: newer patch releases are fine, older majors are untested here.

Create the two databases once, from `psql`, as a user allowed to create databases and schemas:

```sql
CREATE DATABASE astra_learning_sandbox;   -- the development database
CREATE DATABASE astra_test_learning;      -- the automated-test database
```

`server/test/database.cjs` refuses to run unless the database named in `ASTRA_TEST_DATABASE_URL` starts with `astra_test_`. It then creates one uniquely named schema per run and drops it at the end, so the development database is never a fixture.

`npm test` in the `server` package (run `npm test` from the project root, which delegates to it, or from `server`) runs `tsx --test test/*.test.ts`. npm runs scripts through `cmd.exe` on Windows, and `cmd.exe` does not expand the `test/*.test.ts` glob; neither does PowerShell for a native command. Node's own test runner expands the pattern (Node 21+), so `npm test` works on Node 22 - but on an older Node, or with a different runner, you will see "no test files". The shell-independent equivalent is:

```powershell
cd server
npx tsx --test test/bookmarks.test.ts test/metadata.test.ts
```

## Two lessons in one project: read the junior half first

This course carries two different lessons. The **junior lesson** is Zod validation and partial-update semantics for a bookmark record: chapters 1, 3, 4 (validation sections), 5 exercises 1-2 and 7. The **advanced appendix** is the metadata fetcher and its SSRF defences (`server/src/services/metadata.ts`, `test/metadata.test.ts`, the DNS/redirect/port material in chapters 2, 5 exercises 3-4 and 6). Do the junior half completely before touching the appendix; the appendix assumes you already know what a private address range, a DNS rebinding and a redirect chain are.

**A safe host to practise metadata with.** Do not point `BOOKMARK_METADATA_HOSTS` at a real site. Start a local HTTPS stub (the metadata tests show how, with a self-signed certificate and a `Set-Cookie`-free response) and list only that host, e.g. `BOOKMARK_METADATA_HOSTS=localhost` with the stub on 443 or with the port the tests use; manual bookmark creation needs no metadata configuration at all.

## Reading and practice order

1. [Codebase map and reading order](01-CODEBASE-MAP.md)
2. [Concepts explained from first principles](02-CONCEPTS.md)
3. [Worked implementation and examples](03-WORKED-CHANGE.md)
4. [Tests, failure cases and debugging](04-TESTING-AND-DEBUGGING.md)
5. [Guided and independent exercises](05-PRACTICE.md)
6. [Solutions, tradeoffs and review rubric](06-SOLUTIONS-AND-REVIEW.md)
7. [Step-by-step trace lab](07-TRACE-LAB.md)
8. [Actual verification results and limits](VERIFICATION.md)

## Your first session

1. Open the app or its tests and reproduce one normal workflow.
2. Read chapter 1 while keeping [server/src/services/metadata.ts](../server/src/services/metadata.ts) open.
3. Write a prediction for the worked example in chapter 3 before executing it.
4. Run the focused test suite and explain one assertion aloud.
5. Complete the first practice exercise, then check the solution discussion.

Keep a short learning log with four fields: prediction, observed result, explanation and next question. A mismatch is useful evidence: find the exact layer where your mental model diverged from the program. Use a disposable browser profile or local test database for failure experiments so your own records are not part of the fixture.

## Scope

Zod validates create and partial updates. Metadata accepts configured exact HTTPS hosts on port 443, validates public IPv4 DNS answers, pins the connection, rejects redirects, and bounds headers/body/time. The UI applies a proposed title only if its URL still matches the request. This is one bounded improvement, not certification of every feature. Read VERIFICATION.md for checks actually executed. Exercises are intentionally future practice; do not confuse them with completed implementation.
