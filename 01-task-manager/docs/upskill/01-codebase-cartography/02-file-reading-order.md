# File Reading Order

Project: **Personal Task Manager** (`01-task-manager`)

## Junior Path

1. `client/src/App.jsx` - Start with user-facing state and rendering; do not get lost in CSS.
2. `client/src/services/tasksApi.js` - Read request URLs and response unwrapping; look for contract assumptions.
3. `server/src/app.js` - Find middleware order and route mounting.
4. `server/src/routes/taskRoutes.js` - Map API verbs to controllers.
5. `server/src/controllers/taskController.js` - Confirm controllers are thin.
6. `server/src/services/taskService.js` - Study validation, invariants, and branching.
7. `server/src/models/taskModel.js` - Study query shape and persistence ownership.
8. `server/db/migrations/20260703000000_create_tasks_table.js` - Read schema as the durable contract.

## Mid-Level Path

1. `client/src/App.jsx` - Start with user-facing state and rendering; do not get lost in CSS.
2. `client/src/services/tasksApi.js` - Read request URLs and response unwrapping; look for contract assumptions.
3. `server/src/app.js` - Find middleware order and route mounting.
4. `server/src/routes/taskRoutes.js` - Map API verbs to controllers.
5. `server/src/controllers/taskController.js` - Confirm controllers are thin.
6. `server/src/services/taskService.js` - Study validation, invariants, and branching.
7. `server/src/models/taskModel.js` - Study query shape and persistence ownership.
8. `server/db/migrations/20260703000000_create_tasks_table.js` - Read schema as the durable contract.
9. `server/db/seeds/01_tasks.js` - Understand demo states and edge cases.
10. `server/src/middleware/errorMiddleware.js` - Understand how errors become API responses.
11. `server/src/config/env.js` - Learn runtime configuration and secret boundaries.
12. `server/knexfile.js` - Learn CLI database wiring.

## Senior Path

1. Start at `server/db/migrations/20260703000000_create_tasks_table.js` and ask whether the schema supports future change.
2. Move to `server/src/services/taskService.js` and look for implicit invariants.
3. Move to `server/src/models/taskModel.js` and look for unbounded queries, N+1 risk, and transaction boundaries.
4. Move to `server/src/middleware/errorMiddleware.js` and inspect observability and failure contracts.
5. Finish at `client/src/services/tasksApi.js` and ask whether public contracts are stable.

## Pause And Predict

Before opening `server/src/services/taskService.js`, predict where validation should live. After reading, grade whether the code matches that boundary.

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
