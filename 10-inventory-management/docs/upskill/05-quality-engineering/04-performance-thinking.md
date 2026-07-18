# Performance Thinking

Project: **Inventory Management System** (`10-inventory-management`)

## Domains

- Render: `client/src/App.tsx:17` can rerender too much if derived state is duplicated.
- Network: `client/src/services/api.ts:4` should avoid redundant requests.
- Server: `server/src/services/service.ts:5` should not do unnecessary serial IO.
- Database: `server/src/models/model.ts:1` should avoid unbounded list queries and missing indexes.
- Bundle: client dependencies should match real UI need.

## Measure First

Use browser network/devtools, server logs, SQL query inspection, and bundle output before optimizing.

## Drill

Find one list endpoint and design pagination. Include API shape, SQL shape, UI state, and tests.

## Verification Notes

- Generated from inspected files in `10-inventory-management`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
