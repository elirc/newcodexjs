# Code Review Mindset

Project: **Notes App** (`04-notes-app`)

Review layers:

1. Does it work?
2. Is it correct for edge cases?
3. Will it stay correct?
4. Does it fit the codebase boundaries?
5. Is it kind to future maintainers?

Repo-specific checklist:
- UI behavior near `client/src/App.jsx:18`.
- HTTP contract near `client/src/services/api.js:4` and `server/src/routes/routes.js:3`.
- Business rules near `server/src/services/service.js:3`.
- Query shape near `server/src/models/model.js:1`.
- Schema changes near `server/db/migrations/001_init.js:2`.

Good review language:
> Could we move this rule into the service so every API caller gets the same protection?

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
