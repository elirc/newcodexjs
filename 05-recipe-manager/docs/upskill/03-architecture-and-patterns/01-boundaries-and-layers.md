# Boundaries And Layers

Project: **Recipe Manager** (`05-recipe-manager`)

| Layer | Owns | Must Not Own | Anchor |
| --- | --- | --- | --- |
| UI | rendering, local interaction | SQL, secrets | `client/src/App.tsx:19` |
| Client API | HTTP contract | domain rules | `client/src/services/api.ts:4` |
| Routes | paths and verbs | business branching | `server/src/routes/recipeRoutes.ts:1` |
| Controllers | parsing and envelopes | persistence details | `server/src/controllers/recipeController.ts:6` |
| Services | validation and invariants | raw HTTP concerns | `server/src/services/recipeService.ts:17` |
| Models | Knex queries | UI decisions | `server/src/models/recipeModel.ts:2` |
| Migrations | durable schema | request logic | `server/db/migrations/001_initial_schema.ts:5` |

Boundary leak to investigate: any validation duplicated inconsistently between UI and service.

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
