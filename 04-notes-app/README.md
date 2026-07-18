# Notes App

Self-contained Tier 1 full-stack app for the corrected curriculum.

## Run Locally

1. Create a PostgreSQL database named `notes_app_dev`.
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

Server: `http://localhost:4104`
Client: `http://localhost:5173`

## Learning Focus

- Markdown rendering
- folders and tags
- debounced autosave shape
- PostgreSQL full-text search notes

## API Overview

- `GET /api/notes` lists records with optional `search` and `status` filters.
- `GET /api/notes/stats` returns dashboard counts.
- `GET /api/notes/:id` returns one record.
- `POST /api/notes` creates a record.
- `PUT /api/notes/:id` updates a record.
- `DELETE /api/notes/:id` deletes a record.

## Notes

This project is intentionally educational: controllers stay thin, services hold validation and business rules, models own Knex queries, and responses use the standard success/error envelope.
