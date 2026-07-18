# File Reading Order

Project: **Recipe Manager** (`05-recipe-manager`)

## Junior Path

1. `client/src/App.tsx` - Start with user-facing state and rendering; do not get lost in CSS.
2. `client/src/services/api.ts` - Read request URLs and response unwrapping; look for contract assumptions.
3. `server/src/app.ts` - Find middleware order and route mounting.
4. `server/src/routes/recipeRoutes.ts` - Map API verbs to controllers.
5. `server/src/controllers/recipeController.ts` - Confirm controllers are thin.
6. `server/src/services/recipeService.ts` - Study validation, invariants, and branching.
7. `server/src/models/recipeModel.ts` - Study query shape and persistence ownership.
8. `server/db/migrations/001_initial_schema.ts` - Read schema as the durable contract.

## Mid-Level Path

1. `client/src/App.tsx` - Start with user-facing state and rendering; do not get lost in CSS.
2. `client/src/services/api.ts` - Read request URLs and response unwrapping; look for contract assumptions.
3. `server/src/app.ts` - Find middleware order and route mounting.
4. `server/src/routes/recipeRoutes.ts` - Map API verbs to controllers.
5. `server/src/controllers/recipeController.ts` - Confirm controllers are thin.
6. `server/src/services/recipeService.ts` - Study validation, invariants, and branching.
7. `server/src/models/recipeModel.ts` - Study query shape and persistence ownership.
8. `server/db/migrations/001_initial_schema.ts` - Read schema as the durable contract.
9. `server/db/seeds/001_seed.ts` - Understand demo states and edge cases.
10. `server/src/middleware/errorHandler.ts` - Understand how errors become API responses.
11. `server/src/config/env.ts` - Learn runtime configuration and secret boundaries.
12. `server/knexfile.ts` - Learn CLI database wiring.

## Senior Path

1. Start at `server/db/migrations/001_initial_schema.ts` and ask whether the schema supports future change.
2. Move to `server/src/services/recipeService.ts` and look for implicit invariants.
3. Move to `server/src/models/recipeModel.ts` and look for unbounded queries, N+1 risk, and transaction boundaries.
4. Move to `server/src/middleware/errorHandler.ts` and inspect observability and failure contracts.
5. Finish at `client/src/services/api.ts` and ask whether public contracts are stable.

## Pause And Predict

Before opening `server/src/services/recipeService.ts`, predict where validation should live. After reading, grade whether the code matches that boundary.

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
