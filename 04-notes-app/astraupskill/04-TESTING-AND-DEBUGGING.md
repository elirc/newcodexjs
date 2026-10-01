# Testing and debugging

[Course index](README.md)

## Seeing the index work: `EXPLAIN` before and after

The search predicate in `server/src/models/model.js` is `to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,'')) @@ plainto_tsquery('english', ?)`. Without an index PostgreSQL has to compute the vector for every row on every search. Migration `server/db/migrations/002_search_index.js` adds a GIN index on exactly that expression; the expression must match the query text for the planner to use it.

Watch it happen in `psql` against your development database (run `npm run migrate` first):

```sql
INSERT INTO notes (title, body, folder, status)
SELECT 'note ' || g, repeat('lorem ipsum ', 50), 'bulk', 'active' FROM generate_series(1, 20000) g;
EXPLAIN ANALYZE SELECT * FROM notes
 WHERE to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,'')) @@ plainto_tsquery('english', 'ipsum');
```

Before the migration the plan is `Seq Scan on notes` with a `Filter:` line and a time that grows with the table. After `npm run migrate` the same statement shows `Bitmap Heap Scan on notes` fed by `Bitmap Index Scan on notes_search_idx`. The tests do not depend on the index (they apply only `001_init.js` into a throwaway schema); correctness is the same either way, which is the point: an index changes cost, not answers.

## Run the checks

Install dependencies in server and client separately. Follow the root README and .env.example for your development database. Run API scripts from server and frontend scripts from client. Tests require ASTRA_TEST_DATABASE_URL pointing at a dedicated astra_test_* database; they create an isolated schema rather than use development records.

```text
cd server
npm test
```
## Database test setup

Create a dedicated PostgreSQL database such as astra_test_learning. Set your own test credentials in PowerShell:

```powershell
$env:ASTRA_TEST_DATABASE_URL = 'postgres://YOUR_TEST_USER:YOUR_TEST_PASSWORD@127.0.0.1:5432/astra_test_learning'
```

Tests reject differently named databases. The user must be allowed to create schemas. Each run creates and drops only its unique schema. Run npm test from this project's `server` folder. Interrupted runs can leave owned schemas; inspect the dedicated database before cleaning them up. Configuration must precede importing the app's database module.

## What the test suite proves

Read [server/test/search.test.cjs](../server/test/search.test.cjs). The suite targets **PostgreSQL text search, runtime validation and stale responses** and uses the worked fixture:

Running notes matches search run through stemming. A note whose folder is HiddenKeyword does not match that content query. Invalid tags are rejected before writing. Updating only body retains title/id and makes its new words searchable.

The expectation should not be copied from the function being tested. Hand-calculate counts, amounts, identities or elapsed time first. Otherwise the same mistake can appear in both implementation and expected result. Tests that exercise only a mocked dependency prove a narrower contract than tests against the real dependency; read the helper to understand which kind you are running.

## Debugging workflow

1. Reproduce the smallest failing case with the exact input saved in your notes.
2. Inspect the relevant event/request. Confirm the intended handler actually ran.
3. Pause at `listRecords` and inspect input types as well as values.
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

## All regression files in this project

- [server/test/search.test.cjs](../server/test/search.test.cjs)
