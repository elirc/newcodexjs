# Multi-Vendor Marketplace

Large full-stack TypeScript learning app using the same core stack as the earlier projects: React 18, Vite, CSS Modules, Express, PostgreSQL, and Knex.

## Enterprise Features

- vendor-scoped product listings
- moderation lifecycle
- review comments
- saved merchandising views
- bulk listing operations
- auditability for revenue-impacting changes
- pagination, filtering, sorting
- soft delete plus archive/restore lifecycle
- comments for collaboration
- saved views for repeated workflows
- request id and actor context
- audit log and activity feed
- readiness endpoint
- bulk status operations

## Run Locally

```bash
npm --prefix server install
npm --prefix client install
npm --prefix server run migrate
npm --prefix server run seed
npm --prefix server run dev
npm --prefix client run dev
```

Server defaults to `http://localhost:4120`.

## API Highlights

- `GET /api/listings?page=1&pageSize=25&status=...`
- `GET /api/listings/dashboard`
- `GET /api/listings/audit`
- `GET /api/listings/views`
- `POST /api/listings/views`
- `POST /api/listings/bulk/status`
- `PATCH /api/listings/:id/archive`
- `PATCH /api/listings/:id/restore`
- `GET /api/listings/:id/comments`
- `POST /api/listings/:id/comments`

Read `docs/journal.md` for the engineering decisions and learning notes.
