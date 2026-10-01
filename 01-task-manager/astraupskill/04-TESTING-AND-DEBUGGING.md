# Testing and debugging

[Course index](README.md)

## Run the checks

From the `server` folder, install dependencies once (`npm install`) and run `npm test`. The suite needs a PostgreSQL role that can `CREATE SCHEMA` in a database whose name starts with `astra_test_`; it creates a private schema per run and drops it afterwards. Point it at that database with `ASTRA_TEST_DATABASE_URL` (PowerShell: `$env:ASTRA_TEST_DATABASE_URL = "postgres://postgres:local-test@127.0.0.1:5432/astra_test_learning"`).

No local PostgreSQL? Use a throwaway container and create the database once:

```powershell
docker run --rm -d --name astra-pg -e POSTGRES_PASSWORD=local-test -p 5432:5432 postgres:18
docker exec astra-pg createdb -U postgres astra_test_learning
```

The `postgres` superuser has the `CREATE SCHEMA` privilege the harness requires. Stop it with `docker stop astra-pg` when you are done; nothing persists.

## Running the database tests safely

Create a separate local PostgreSQL database whose name starts with `astra_test_`, for example `astra_test_learning`. The tests refuse a differently named database. In PowerShell, set your own local test connection:

```powershell
$env:ASTRA_TEST_DATABASE_URL = 'postgres://YOUR_TEST_USER:YOUR_TEST_PASSWORD@127.0.0.1:5432/astra_test_learning'
cd server
npm install
npm test
```

Replace the placeholders with your local test credentials; they are not application defaults. The user must be able to create a schema in that database. Each run creates a uniquely named schema, runs the existing migrations there, and drops only its own schema after the tests. It does not use the development database’s data as a fixture. If a run is interrupted, a uniquely named test schema may remain; inspect the test database before cleaning it up.

The helper configures the app before importing its database module. That order matters: configuration is captured when modules are loaded. The suite exercises actual PostgreSQL constraints and transaction rollback, rather than substituting a JavaScript array for SQL behavior.

## What the test suite proves

Read [server/test/tasks.test.cjs](../server/test/tasks.test.cjs). The suite targets **HTTP contracts, service validation and real SQL persistence** and uses the worked fixture:

Create a high-priority task due 2099-01-01, filter for high priority, mark it done, reopen it and delete it. Separately seed a task due 2020-01-01: editing its title with that same due date succeeds, but changing it to another past date fails.

The expectation should not be copied from the function being tested. Hand-calculate counts, amounts, identities or elapsed time first. Otherwise the same mistake can appear in both implementation and expected result. Tests that exercise only a mocked dependency prove a narrower contract than tests against the real dependency; read the helper to understand which kind you are running.

## Debugging workflow

1. Reproduce the smallest failing case with the exact input saved in your notes.
2. Inspect the relevant event/request. Confirm the intended handler actually ran.
3. Pause at `buildUpdatePayload` and inspect input types as well as values.
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
