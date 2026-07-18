# Fast Track

Project: **Recipe Manager** (`05-recipe-manager`)

## Weekend Goal

Run the app, trace one end-to-end user flow, and make a safe small change using existing patterns.

## Commands

| Task | Command | Status |
| --- | --- | --- |
| Install client | `npm --prefix client install` | inferred |
| Install server | `npm --prefix server install` | inferred |
| Run client | `npm --prefix client run dev` | verified in package.json |
| Run server | `npm --prefix server run dev` | verified in package.json |
| Build client | `npm --prefix client run build` | verified in package.json |
| Build server | `npm --prefix server run build` | verified in package.json |
| Migrate database | `npm --prefix server run migrate` | verified in package.json |
| Seed database | `npm --prefix server run seed` | verified in package.json |

## First 10 Files To Open

1. `client/src/App.tsx` - UI ownership and page state.
2. `client/src/services/api.ts` - client/server contract.
3. `server/src/app.ts` - middleware and route mounting.
4. `server/src/routes/recipeRoutes.ts` - public API shape.
5. `server/src/controllers/recipeController.ts` - request/response envelope.
6. `server/src/services/recipeService.ts` - business rules and validation boundary.
7. `server/src/models/recipeModel.ts` - Knex query ownership.
8. `server/db/migrations/001_initial_schema.ts` - database contract.
9. `server/db/seeds/001_seed.ts` - realistic local data.
10. `server/src/middleware/errorHandler.ts` - error translation boundary.

## Two Flows To Trace

- UI list load: `client/src/App.tsx:19` -> `client/src/services/api.ts:4` -> `server/src/routes/recipeRoutes.ts:1` -> `server/src/services/recipeService.ts:17` -> `server/src/models/recipeModel.ts:2`.
- Create/update flow: form state -> API call -> controller -> service validation -> database write -> UI refresh.

## Safe Change

Add one display-only field, empty-state text, or filter option. Keep the blast radius small: UI component, API service if needed, service validation, migration only if the data contract changes.

## Teach-Back

Explain why controllers should stay thin in this repo. Strong answer: identifies the service as the business boundary, names a failure mode, and proposes a test.

## Not Covered

This fast path does not fully cover security, performance, migrations, or interview prep. Use the later modules for those.

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
