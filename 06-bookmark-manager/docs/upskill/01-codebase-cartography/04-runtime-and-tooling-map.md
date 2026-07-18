# Runtime And Tooling Map

Project: **Bookmark Manager** (`06-bookmark-manager`)

## Runtime Boundaries

- Browser: React UI in `client/src/App.tsx`.
- Server: Express API in `server/src/app.ts` and `server/src/server.ts`.
- Database: PostgreSQL accessed through Knex from `server/src/models/model.ts`.
- CLI tooling: migrations and seeds through `server/knexfile.ts`.

## Scripts

- Install client: `npm --prefix client install` (inferred)
- Install server: `npm --prefix server install` (inferred)
- Run client: `npm --prefix client run dev` (verified in package.json)
- Run server: `npm --prefix server run dev` (verified in package.json)
- Build client: `npm --prefix client run build` (verified in package.json)
- Build server: `npm --prefix server run build` (verified in package.json)
- Migrate database: `npm --prefix server run migrate` (verified in package.json)
- Seed database: `npm --prefix server run seed` (verified in package.json)

## Important Dependencies

@vitejs/plugin-react, axios, cors, dotenv, express, helmet, knex, morgan, pg, react, react-dom, vite, zod

## Environment Variables

Read `.env.example` and `server/src/config/env.ts`. Treat database credentials as secrets even in local examples.

## Verification Notes

- Generated from inspected files in `06-bookmark-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
