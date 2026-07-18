# Data Model And Persistence

Project: **Recipe Manager** (`05-recipe-manager`)

The durable model starts at `server/db/migrations/001_initial_schema.ts:5`; local learning data starts at `server/db/seeds/001_seed.ts:19`; runtime queries are concentrated around `server/src/models/recipeModel.ts:2`.

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

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
