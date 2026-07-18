# Writing Tests Here

Project: **Recipe Manager** (`05-recipe-manager`)

## Test Recipes

1. Happy path create: call API route, assert envelope and DB row.
2. Validation failure: send invalid payload, assert 400 envelope.
3. Not found: request missing id, assert 404 envelope.
4. Persistence behavior: run migration, insert seed-like row, query through model.
5. UI state: submit form and assert list refreshes.
6. Contract test: ensure `client/src/services/api.ts:4` can unwrap server responses.
7. Security placeholder: if auth exists, assert wrong user cannot access another user's record.

## Commands

Use package scripts from `client/package.json` and `server/package.json`. If no test script exists, the first contribution can add a small test harness.

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
