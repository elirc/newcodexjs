# Verification: Notes API: actual content search

[Course index](README.md)

Verified on isolated working copies before application to the original project folder.

| Check | Result |
|---|---|
| tests | Passed |
| build | Passed |
| Chromium interaction | Passed |

Automated test cases: **4** named blocks in `server/test/search.test.cjs` (search semantics, filter composition, deterministic ordering, partial update and validation rejections), about twenty assertions in total. Astra delivered them as one block; the fix pass split them so the count reflects the coverage.

## What the evidence covers

Running notes matches search run through stemming. A note whose folder is HiddenKeyword does not match that content query. Invalid tags are rejected before writing. Updating only body retains title/id and makes its new words searchable.

## Environment and limits

The harness used Node 22.16.0 and isolated dependencies matching the relevant declared packages. PostgreSQL tests used a separate local PostgreSQL 18.1 instance on port 55439 and uniquely named schemas in a dedicated test database. No development databases or personal saved records were fixtures. The source files were verified byte-for-byte after copying into the originals.

Browser checks used the real built client with controlled API responses, verifying event wiring, rendering and error feedback. Separately, the backend tests used actual HTTP and disposable file/database persistence. The browser check is not a claim that a deployed full-stack environment was exercised end to end.

## Reproduce

Install dependencies in server and client separately. Follow the root README and .env.example for your development database. Run API scripts from server and frontend scripts from client. Tests require ASTRA_TEST_DATABASE_URL pointing at a dedicated astra_test_* database; they create an isolated schema rather than use development records.

Reading the diff: the files Astra touched were re-saved with CRLF line endings and Prettier formatting, so a plain `diff` shows whole files as changed. Compare with `git diff -w`, or `diff -r --strip-trailing-cr -w <backup> <project>` against the pre-change backup, to see only the real edits.

## Database test setup

Create a dedicated PostgreSQL database such as astra_test_learning. Set your own test credentials in PowerShell:

```powershell
$env:ASTRA_TEST_DATABASE_URL = 'postgres://YOUR_TEST_USER:YOUR_TEST_PASSWORD@127.0.0.1:5432/astra_test_learning'
```

Tests reject differently named databases. The user must be allowed to create schemas. Each run creates and drops only its unique schema. Run npm test from this project's `server` folder. Interrupted runs can leave owned schemas; inspect the dedicated database before cleaning them up. Configuration must precede importing the app's database module.


## Boundaries

These checks cover the implemented improvements and described regression cases. They do not certify unrelated features or production readiness. Exercises in chapter 5 remain learner work. Source, test and setup limitations are explained in the concepts and trace lab.

Machine-readable results and logs are retained in AstraOrganized2/astrafinalplan/implementation/batch02. The combined report is in AstraOrganized2/astrdocs/ALL_20_PROJECTS_REPORT.md.

## Accuracy pass 2026-10-06

Documentation accuracy pass (2026-10-06): every relative link and `path:line` citation in this course, README.md and docs/ was re-checked against the files on disk (all resolve and are in range), npm script names were matched against package.json, and the trace-lab client-side claims were re-read against the client source. No course corrections were needed.
