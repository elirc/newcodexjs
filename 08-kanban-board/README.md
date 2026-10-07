# Kanban Board

Self-contained Tier 1 full-stack app for the corrected curriculum.

## Run Locally

1. Create a PostgreSQL database named `kanban_board_dev`.
2. Copy `.env.example` to `.env` and adjust credentials.
3. Install dependencies in both apps:

```bash
npm --prefix server install
npm --prefix client install
npm --prefix server run migrate
npm --prefix server run seed
npm --prefix server run dev
npm --prefix client run dev
```

Server: `http://localhost:4108`
Client: `http://localhost:5173`

## Learning Focus

Topics the labs in `docs/FABLE.md` build; the scaffold does not implement them yet (see `docs/architecture.md`).

- drag-and-drop dependency wiring
- optimistic reorder flow
- fractional indexing
- nested board/list/card state

## API Overview

- `GET /api/cards` lists records with optional `search` and `status` filters.
- `GET /api/cards/stats` returns dashboard counts.
- `GET /api/cards/:id` returns one record.
- `POST /api/cards` creates a record.
- `PUT /api/cards/:id` updates a record.
- `DELETE /api/cards/:id` deletes a record.

## Notes

This project is intentionally educational: controllers stay thin, services hold validation and business rules, models own Knex queries, and responses use the standard success/error envelope.

## Junior SWE learning course

[Start the detailed Astra upskilling course](astraupskill/README.md): partial updates, JSON fields and recoverable forms, with a codebase map, worked implementation, executable examples, debugging labs, exercises and solution discussions.
