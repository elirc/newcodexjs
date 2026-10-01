# Testing and debugging

[Course index](README.md)

## Run the checks

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

```text
npm test
npm run build
```
The [test/database.ts](../test/database.ts) helper demonstrates migration-based isolation. It sets DATABASE_URL before importing the Knex connection and uses a unique PostgreSQL schema. The root workspace also makes pg and tsx available to the root test directory. A source import ending in .js is intentional: TypeScript resolves its .ts source during development and emitted Node code resolves .js after compilation.
## What the test suite proves

Read [test/crud.test.ts](../test/crud.test.ts). The suite targets **partial updates, JSON fields and recoverable forms** and uses the worked fixture:

POST this synthetic input: {"title": "Card title", "body": "Card description", "lane": "todo", "status": "todo", "tags": ["product"]}. Then PUT only {"title":"Revised lesson"} to its ID and check the other fields remain. Tags ["API"," api "] produce one logical tag. Reject a numeric title and verify the row is unchanged; delete it and check a second delete returns 404.

The expectation should not be copied from the function being tested. Hand-calculate counts, amounts, identities or elapsed time first. Otherwise the same mistake can appear in both implementation and expected result. Tests that exercise only a mocked dependency prove a narrower contract than tests against the real dependency; read the helper to understand which kind you are running.

This project runs its real Express app through HTTP with a disposable PostgreSQL database. Browser checks exercise the built client separately. Read the project verification page for the exact observed checks and limits.

## Debugging workflow

1. Reproduce the smallest failing case with the exact input saved in your notes.
2. Inspect the relevant event/request. Confirm the intended handler actually ran.
3. Pause at `parsePayload` and inspect input types as well as values.
4. Follow validation branches, noting whether any state or persistence changed before rejection.
5. Inspect the write result and the subsequent render/response. Separate storage correctness from display correctness.
6. Add a regression reproducing the failure, make the smallest justified fix, then run the focused suite and relevant broader checks.

Avoid changing several layers at once when you do not yet know where the failure starts. A correct backend with a stale UI needs a different fix from a malformed query or an invalid saved document.

## Failure experiments

- Reuse the invalid fixture from the tests and verify no unintended records or fields change.
- Reload or restart after a successful operation to distinguish persistence from temporary screen state.
- Repeat the operation and explain whether it should be idempotent, rejected or intentionally create another record.
- Simulate the relevant timing or storage failure only in a disposable fixture. Restore normal behavior after the experiment.

## Reading an assertion failure

“Expected 3, received 4” is evidence about one observation, not a complete diagnosis. Ask whether the fixture created an extra record, the operation ran twice, an old record survived, or the assertion looked at an unfiltered collection. Start from the state table and trace the first point where the actual value diverges. A stack trace identifies where the program noticed a problem, which may be later than the code that caused it.

## Verification record

The companion [VERIFICATION.md](VERIFICATION.md) records checks actually run for this implementation. Record your own command, date, result and any environmental prerequisite when practicing. A passing test does not imply every route, browser, dependency version or production deployment has been exercised.
