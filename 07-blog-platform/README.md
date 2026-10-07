# Blog Platform

Self-contained Tier 1 full-stack app for the corrected curriculum.

## Run Locally

1. Create a PostgreSQL database named `blog_platform_dev`.
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

Server: `http://localhost:4107`
Client: `http://localhost:5173`

## Learning Focus

Topics the labs in `docs/FABLE.md` build; the scaffold does not implement them yet (see `docs/architecture.md`).

- rich text editor dependency wiring
- HTML sanitization boundary
- nested comment model notes
- RSS and slug generation

## API Overview

- `GET /api/posts` lists records with optional `search` and `status` filters.
- `GET /api/posts/stats` returns dashboard counts.
- `GET /api/posts/:id` returns one record.
- `POST /api/posts` creates a record.
- `PUT /api/posts/:id` updates a record.
- `DELETE /api/posts/:id` deletes a record.

## Notes

This project is intentionally educational: controllers stay thin, services hold validation and business rules, models own Knex queries, and responses use the standard success/error envelope.

## Junior SWE learning course

[Start the detailed Astra upskilling course](astraupskill/README.md): partial updates, JSON fields and recoverable forms, with a codebase map, worked implementation, executable examples, debugging labs, exercises and solution discussions.
