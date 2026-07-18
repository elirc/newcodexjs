# Tooling And Build System

Project: **Bookmark Manager** (`06-bookmark-manager`)

- Install client: `npm --prefix client install` - inferred
- Install server: `npm --prefix server install` - inferred
- Run client: `npm --prefix client run dev` - verified in package.json
- Run server: `npm --prefix server run dev` - verified in package.json
- Build client: `npm --prefix client run build` - verified in package.json
- Build server: `npm --prefix server run build` - verified in package.json
- Migrate database: `npm --prefix server run migrate` - verified in package.json
- Seed database: `npm --prefix server run seed` - verified in package.json

## Build Judgment

A passing build proves syntax and bundling, not correctness. Pair build checks with API tests, migration checks, and a browser flow.

## Drill

Run install, build, and one dev server. Record what failed because of local services such as PostgreSQL.

## Verification Notes

- Generated from inspected files in `06-bookmark-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
