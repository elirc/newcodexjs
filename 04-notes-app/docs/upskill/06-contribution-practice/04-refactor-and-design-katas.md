# Refactor And Design Katas

Project: **Notes App** (`04-notes-app`)

- Identify a boundary leak between `server/src/controllers/controller.js:4` and `server/src/services/service.js:3`.
- Propose a transaction boundary for a multi-write flow.
- Split a large UI component without changing behavior.
- Improve type safety around `client/src/services/api.js:4`.
- Add pagination without breaking existing clients.
- Reduce a hypothetical N+1 query in `server/src/models/model.js:1`.
- Write an RFC for auth/ownership.
- Review a fake PR that changes `server/db/migrations/001_init.js:2` without rollback notes.

Self-grade: strong answers name blast radius, migration path, test plan, and rollback.

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
