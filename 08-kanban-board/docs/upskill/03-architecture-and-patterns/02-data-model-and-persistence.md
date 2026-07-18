# Data Model And Persistence

Project: **Kanban Board** (`08-kanban-board`)

The durable model starts at `server/db/migrations/001_init.ts:4`; local learning data starts at `server/db/seeds/001_seed.ts:5`; runtime queries are concentrated around `server/src/models/model.ts:1`.

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

- Generated from inspected files in `08-kanban-board`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
