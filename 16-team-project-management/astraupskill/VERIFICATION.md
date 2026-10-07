# Verification: Team Project Management: lifecycle and bulk edits

[Course index](README.md)

Verified September 8, 2026 in isolated working copies before application to the original folder.

| Check | Result |
|---|---|
| build | Passed |
| client-typecheck | Passed |
| server-build | Passed |
| server-typecheck | Passed |
| setup-migrate | Passed |
| setup-seed | Passed |
| tests | Passed |
| Chromium interaction | Passed |

Automated test cases: **4** delivered by Astra, plus **1** added in the fix pass (distinct-id cap and restore status), for 5 in `test/crud.test.ts`.

## Tested behavior

Create a record in in_progress, archive it twice and restore it twice. Only the actual transitions add history, and restore returns in_progress. Bulk-update [existingId,999999]: return 404 and leave the existing row unchanged. A duplicated valid ID changes once and audit.before/status differs from audit.after/status.

The course contains additional hand-worked examples and optional exercises. These are not counted as implemented tests.

## Environment and scope

Node 22.16.0, PostgreSQL 18.1 where applicable, and dependencies installed in the isolated verification workspace were used. The exact dependency versions are recorded with the batch evidence. Floating dependency declarations remain floating; a clean dependency install was not repeated in every original folder.

Chromium used the actual built client and actual isolated Express server. A local verification proxy forwarded API requests and adjusted CORS for its temporary origin; it did not fabricate API responses. Data used a disposable PostgreSQL schema.

The browser screenshot was also captured at a 390px viewport. Measured document width: 390px. This is a layout smoke check, not a complete accessibility or device audit.

## Reproduce

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

The [test/database.ts](../test/database.ts) helper demonstrates migration-based isolation. It sets DATABASE_URL before importing the Knex connection and uses a unique PostgreSQL schema. The root workspace also makes pg and tsx available to the root test directory. A source import ending in .js is intentional: TypeScript resolves its .ts source during development and emitted Node code resolves .js after compilation.

Reading the diff: the files Astra touched were re-saved with CRLF line endings and Prettier formatting, so a plain `diff` shows whole files as changed. Compare with `git diff -w`, or `diff -r --strip-trailing-cr -w <backup> <project>` against the pre-change backup, to see only the real edits.

## Limits

The server validates partial fields before writing and keeps IDs stable. The version increments on change, but this is not yet optimistic concurrency: a client does not send an expected version. A row lock serializes writes; it does not detect a stale full-form edit. The role header is a demo mechanism, and workspace_id is a grouping foreign key rather than an enforced tenant boundary. The scaffold demonstrates administration, not every operational feature suggested by its product name.

These are focused learning improvements, not a production-readiness certification. Existing integrations and all optional exercises are outside the checked boundary unless named above.

Delivery hashes and local course links are checked after applying the files. Logs, screenshots, diffs and backups are in AstraOrganized2/astrafinalplan/implementation/batch04. The combined report is AstraOrganized2/astrdocs/ALL_75_PROJECTS_REPORT.md.

## Documentation accuracy pass (2026-10-06)

Re-checked every `path:line` citation, relative link and backticked repository path in README.md, docs/ and astraupskill/ against the source. Fixed 07-TRACE-LAB.md (`lifecycleUpdate` starts at model.ts line 170, not 173) and docs/FABLE.md (demo headers are `x-demo-user`/`x-demo-role`, `.env` lives at the project root, file line counts). Expanded docs/architecture.md as the full walkthrough of the shared 16-20 template. No code, tests or packages were run or changed in this pass.
