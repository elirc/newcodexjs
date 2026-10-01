# Testing and debugging

[Course index](README.md)

## Run the checks

Install dependencies in server and client separately. Follow the root README and .env.example for your development database. Run API scripts from server and frontend scripts from client. Tests require ASTRA_TEST_DATABASE_URL pointing at a dedicated astra_test_* database; they create an isolated schema rather than use development records. Metadata is disabled until BOOKMARK_METADATA_HOSTS contains exact HTTPS hostnames. Manual bookmark creation needs no metadata configuration. Verification used only a controlled local stub.

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

Read [server/test/metadata.test.ts](../server/test/metadata.test.ts). The suite targets **runtime schemas, outbound policy and controlled network tests** and uses the worked fixture:

A controlled host returns title A &amp; B, yielding A & B. A redirect to loopback is rejected without contacting its target. Private DNS, unlisted hosts, oversized bodies and timeouts fail. DNS finishing after timeout cannot start a transfer. A javascript: URL is rejected before insertion.

The expectation should not be copied from the function being tested. Hand-calculate counts, amounts, identities or elapsed time first. Otherwise the same mistake can appear in both implementation and expected result. Tests that exercise only a mocked dependency prove a narrower contract than tests against the real dependency; read the helper to understand which kind you are running.

## Debugging workflow

1. Reproduce the smallest failing case with the exact input saved in your notes.
2. Inspect the relevant event/request. Confirm the intended handler actually ran.
3. Pause at `fetchMetadata` and inspect input types as well as values.
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

- [server/test/bookmarks.test.ts](../server/test/bookmarks.test.ts)
- [server/test/metadata.test.ts](../server/test/metadata.test.ts)
