# Type System And Contracts

Project: **Notes App** (`04-notes-app`)

This project is JavaScript-based for early Tier 1 fundamentals.

## Contracts To Watch

- UI form shape: `client/src/App.jsx:18`.
- HTTP request/response shape: `client/src/services/api.js:4` and `server/src/routes/routes.js:3`.
- Domain payload shape: `server/src/services/service.js:3`.
- Database row shape: `server/db/migrations/001_init.js:2`.

## Junior Mistake

Treating the database row as the UI state. Better: let the API service normalize response shape so the UI is not coupled to persistence.

## Drill

Write a small contract table: field, source, validation owner, persistence column, display owner.

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
