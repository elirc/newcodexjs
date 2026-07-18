# Project 2: Contact Book / Address Manager

Full-stack JavaScript contact manager with React 18, Express, PostgreSQL, and Knex.

## Run locally

1. Create a PostgreSQL database named `contact_book_dev`.
2. Copy `.env.example` to `.env` and adjust values if needed.
3. In `server/`, run `npm install`, `npm run migrate`, `npm run seed`, then `npm run dev`.
4. In `client/`, run `npm install` then `npm run dev`.

## Features

- Paginated contacts with debounced search, tag filtering, and sortable table columns.
- Create, edit, detail view, single delete, and bulk delete contacts.
- Many-to-many tags with create/update/delete endpoints and colored pills in the UI.
- CSV export plus CSV import by sending CSV text to `/api/contacts/import`.

See `docs/architecture.md` for the layer-by-layer design.
