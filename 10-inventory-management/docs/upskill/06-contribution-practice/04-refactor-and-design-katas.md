# Refactor And Design Katas

Project: **Inventory Management System** (`10-inventory-management`)

- Identify a boundary leak between `server/src/controllers/controller.ts:6` and `server/src/services/service.ts:5`.
- Propose a transaction boundary for a multi-write flow.
- Split a large UI component without changing behavior.
- Improve type safety around `client/src/services/api.ts:4`.
- Add pagination without breaking existing clients.
- Reduce a hypothetical N+1 query in `server/src/models/model.ts:1`.
- Write an RFC for auth/ownership.
- Review a fake PR that changes `server/db/migrations/001_init.ts:4` without rollback notes.

Self-grade: strong answers name blast radius, migration path, test plan, and rollback.

## Verification Notes

- Generated from inspected files in `10-inventory-management`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
