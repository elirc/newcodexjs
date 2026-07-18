# Runtime And Tooling Map

Project: **Personal Expense Tracker** (`03-expense-tracker`)

## Runtime Boundaries

- Browser: React UI in `client/src/App.jsx`.
- Server: Express API in `server/src/app.js` and `server/src/server.js`.
- Database: PostgreSQL accessed through Knex from `server/src/models/expenseModel.js`.
- CLI tooling: migrations and seeds through `server/knexfile.js`.

## Scripts

- Install client: `npm --prefix client install` (inferred)
- Install server: `npm --prefix server install` (inferred)
- Run client: `npm --prefix client run dev` (verified in package.json)
- Run server: `npm --prefix server run dev` (verified in package.json)
- Build client: `npm --prefix client run build` (verified in package.json)
- Build server: `npm --prefix server run build` (not applicable for JS scaffold)
- Migrate database: `npm --prefix server run migrate` (verified in package.json)
- Seed database: `npm --prefix server run seed` (verified in package.json)

## Important Dependencies

axios, cors, dotenv, express, helmet, knex, morgan, pg, react, react-dom, react-router-dom, recharts

## Environment Variables

Read `.env.example` and `server/src/config/env.js`. Treat database credentials as secrets even in local examples.

## Verification Notes

- Generated from inspected files in `03-expense-tracker`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/expenseRoutes.js`, `server/src/services/expenseService.js`, `server/src/models/expenseModel.js`, `server/db/migrations/202607030301_create_expense_tracker.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
