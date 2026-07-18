# System Map

Project: **Recipe Manager** (`05-recipe-manager`)

```text
client React UI
  -> client API service
  -> Express app/routes
  -> controller
  -> service/business rules
  -> model/Knex
  -> PostgreSQL tables + seed data
```

| Area | Owner | Anchor | Public or Private |
| --- | --- | --- | --- |
| UI | React page/components | `client/src/App.tsx:19` | Public user surface |
| Client API | HTTP contract wrapper | `client/src/services/api.ts:4` | Internal client boundary |
| API app | middleware, health, route mount | `server/src/app.ts:3` | Public HTTP surface |
| Routes | method/path contract | `server/src/routes/recipeRoutes.ts:1` | Public API contract |
| Controller | envelope and request parsing | `server/src/controllers/recipeController.ts:6` | Internal transport boundary |
| Service | invariants and business rules | `server/src/services/recipeService.ts:17` | Domain boundary |
| Model | Knex queries | `server/src/models/recipeModel.ts:2` | Persistence boundary |
| Data | migrations and seeds | `server/db/migrations/001_initial_schema.ts:5`, `server/db/seeds/001_seed.ts:19` | Database contract |

Public interfaces are the browser UI and API routes. Private internals are service/model implementations, migration details, and UI state helpers.

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
