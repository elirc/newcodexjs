# Data Model And Persistence

Project: **Notes App** (`04-notes-app`)

The durable model starts at `server/db/migrations/001_init.js:2`; local learning data starts at `server/db/seeds/001_seed.js:3`; runtime queries are concentrated around `server/src/models/model.js:1`.

## Schema Change Checklist

1. Add reversible migration.
2. Update seed data.
3. Update service validation.
4. Update client API and UI display.
5. Add regression tests or at least a manual verification note.
6. Think about rollback: can old code tolerate the new column?

## Transaction Thinking

If one user action writes multiple tables, the service should own a transaction boundary and the model should accept a transaction object. Investigate this before adding multi-step writes.

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
