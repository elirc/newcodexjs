# Verification: Polling Chat: scope every conversation operation

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

Automated test cases: **3** delivered by Astra, plus **1** added in the fix pass (read receipt without a message id is 400), for 4 in `test/membership.test.ts`.

## Tested behavior

User 3 cannot read or poll the study room, react to its messages, type there or add members. User 2 can read and react but cannot manage members. A receipt pointing to another room is rejected. The author can edit/delete a message; a deleted message cannot be revived by editing.

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

Polling retrieves messages after a cursor. Membership must be checked on every poll, not only when the UI first opens a room, because membership can change. This central check is a useful boundary, but it is not a transaction spanning every subsequent read; strict coordination with simultaneous membership removal would need additional policy and locking.

These are focused learning improvements, not a production-readiness certification. Existing integrations and all optional exercises are outside the checked boundary unless named above.

Delivery hashes and local course links are checked after applying the files. Logs, screenshots, diffs and backups are in AstraOrganized2/astrafinalplan/implementation/batch04. The combined report is AstraOrganized2/astrdocs/ALL_75_PROJECTS_REPORT.md.
