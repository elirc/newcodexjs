# Validation, Auth, And Permissions

Project: **Personal Task Manager** (`01-task-manager`)

## Validation Map

- Client validation: `client/src/App.jsx:7`.
- API contract validation: `client/src/services/tasksApi.js:1`.
- Server/domain validation: `server/src/services/taskService.js:17`.
- Database constraints: `server/db/migrations/20260703000000_create_tasks_table.js:45`.

## Auth Map

This project is mostly demo/local and may not include full authentication. Treat that as a learning limitation, not a production pattern.

## What A Junior Might Miss

A hidden input or disabled UI button is not authorization. The server must enforce ownership and permission checks.

## What A Senior Checks

IDOR risk, tenant/user scoping, cookie/session settings, CSRF expectations, and whether validation happens before side effects.

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
