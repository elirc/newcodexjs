# Code Review Mindset

Project: **Recipe Manager** (`05-recipe-manager`)

Review layers:

1. Does it work?
2. Is it correct for edge cases?
3. Will it stay correct?
4. Does it fit the codebase boundaries?
5. Is it kind to future maintainers?

Repo-specific checklist:
- UI behavior near `client/src/App.tsx:19`.
- HTTP contract near `client/src/services/api.ts:4` and `server/src/routes/recipeRoutes.ts:1`.
- Business rules near `server/src/services/recipeService.ts:17`.
- Query shape near `server/src/models/recipeModel.ts:2`.
- Schema changes near `server/db/migrations/001_initial_schema.ts:5`.

Good review language:
> Could we move this rule into the service so every API caller gets the same protection?

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
