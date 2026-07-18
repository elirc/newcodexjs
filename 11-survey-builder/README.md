# Project 11: Poll / Survey Builder

A self-contained TypeScript learning app for creating surveys, collecting public responses, and reviewing aggregated results.

## Run locally

1. Install dependencies in both apps:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
2. Copy `.env.example` values into `server/.env`.
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

## Demo auth

Authenticated routes read `x-demo-user-id` and fall back to `DEMO_USER_ID`. This keeps the project focused on dynamic survey building instead of authentication.

## Included scope

- Survey CRUD with draft, active, closed status.
- Nested question and option creation, editing, deletion, and reordering.
- Public survey rendering and response submission with access-code verification.
- Aggregated results with chart-like bars, rating averages, matrix totals, and CSV export.
- Template duplication through `POST /api/surveys/:id/duplicate`.

See [docs/architecture.md](docs/architecture.md) for the layer-by-layer design.

