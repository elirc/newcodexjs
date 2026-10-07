# Project 11: Poll / Survey Builder

A self-contained TypeScript learning app for creating surveys, collecting public responses, and reviewing aggregated results.

## Run locally

1. Install dependencies in both apps:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
2. Copy the project-root `.env.example` values into `server/.env` (the server calls `dotenv.config()` from its own folder).
3. Create the PostgreSQL database named in `DATABASE_URL`.
4. Run migrations and seeds:
   ```bash
   cd server
   npm run migrate
   npm run seed
   ```
5. Start both apps:
   ```bash
   npm run dev
   cd ../client && npm run dev
   ```

The project root `package.json` also defines workspace shortcuts: `npm run db:migrate`, `npm run db:seed`, `npm run dev` (API and client together via `concurrently`) and `npm test`. Tests need a PostgreSQL database whose name starts with `astra_test_`, passed as `ASTRA_TEST_DATABASE_URL` (see `test/database.ts`).

## Demo auth

Authenticated routes read `x-demo-user-id` and fall back to `DEMO_USER_ID`. This keeps the project focused on dynamic survey building instead of authentication.

## Included scope

- Survey CRUD with draft, active, closed status.
- Nested question and option creation, editing, deletion, and reordering.
- Public survey rendering and response submission with server-side access-code verification (the bundled public page has no access-code field yet).
- Aggregated results with chart-like bars, rating averages, matrix totals, and CSV export.
- Template duplication through `POST /api/surveys/:id/duplicate`.

See [docs/architecture.md](docs/architecture.md) for the layer-by-layer design.

## Junior SWE learning course

[Start the detailed Astra upskilling course](astraupskill/README.md): nested validation and atomic response submission, with a codebase map, worked implementation, executable examples, debugging labs, exercises and solution discussions.
