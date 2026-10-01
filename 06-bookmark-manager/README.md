# Bookmark Manager

Self-contained Tier 1 full-stack app for the corrected curriculum.

## Run Locally

1. Create a PostgreSQL database named `bookmark_manager_dev`.
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

Server: `http://localhost:4106`
Client: `http://localhost:5173`

## Learning Focus

- Zod validation
- API versioning
- external URL metadata placeholder
- bookmarklet-friendly API

## API Overview

- `GET /api/bookmarks` lists records with optional `search` and `status` filters.
- `GET /api/bookmarks/stats` returns dashboard counts.
- `GET /api/bookmarks/:id` returns one record.
- `POST /api/bookmarks` creates a record.
- `PUT /api/bookmarks/:id` updates a record.
- `DELETE /api/bookmarks/:id` deletes a record.

## Notes

This project is intentionally educational: controllers stay thin, services hold validation and business rules, models own Knex queries, and responses use the standard success/error envelope.

## Junior SWE learning course

[Start the detailed Astra upskilling course](astraupskill/README.md): runtime schemas, outbound policy and controlled network tests, with a codebase map, worked implementation, executable examples, debugging labs, exercises and solution discussions.
