# Runtime And Tooling Map

Project: **Recipe Manager** (`05-recipe-manager`)

## Runtime Boundaries

- Browser: React UI in `client/src/App.tsx`.
- Server: Express API in `server/src/app.ts` and `server/src/server.ts`.
- Database: PostgreSQL accessed through Knex from `server/src/models/recipeModel.ts`.
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

@vitejs/plugin-react, axios, bcryptjs, cookie-parser, cors, dotenv, express, helmet, jsonwebtoken, knex, morgan, pg, react, react-dom, react-router-dom, vite

## Environment Variables

Read `.env.example` and `server/src/config/env.ts`. Treat database credentials as secrets even in local examples.

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
