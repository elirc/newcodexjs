# Architecture Critique

Project: **Recipe Manager** (`05-recipe-manager`)

## Strong Choices

- Clear client/server split.
- Layered API path from routes to controllers to services to models.
- Versioned migrations and seed data.
- Local-first learning commands.

## Risks And Tradeoffs

| Risk | Evidence | Impact | Confidence |
| --- | --- | --- | --- |
| Missing or light test coverage | No test files confirmed in this pass | regressions can slip | medium |
| Demo auth or no auth | inspect `server/src/routes/recipeRoutes.ts:1` and auth middleware if present | IDOR risk in real apps | medium |
| Unbounded list endpoints | inspect `server/src/models/recipeModel.ts:2` | latency and memory risk | medium |
| Thin observability | inspect `server/src/app.ts:3` and `server/src/middleware/errorHandler.ts:2` | debugging production issues is harder | medium |

## If I Owned This For Three Months

1. Add API integration tests for create/update/delete.
2. Add pagination and indexes for list endpoints.
3. Add explicit auth/ownership checks where user data exists.
4. Add structured logging around errors and slow queries.
5. Write schema migration playbooks.

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
