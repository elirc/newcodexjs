# Real-Time Chat Platform

Large full-stack TypeScript learning app using the same core stack as the earlier projects: React 18, Vite, CSS Modules, Express, PostgreSQL, and Knex.

## Enterprise Features

- workspace-scoped conversations
- presence/readiness metadata
- moderation comments
- saved operational views
- bulk archive/mute operations
- auditability for moderation events
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

Server defaults to `http://localhost:4119`.

## API Highlights

- `GET /api/conversations?page=1&pageSize=25&status=...`
- `GET /api/conversations/dashboard`
- `GET /api/conversations/audit`
- `GET /api/conversations/views`
- `POST /api/conversations/views`
- `POST /api/conversations/bulk/status`
- `PATCH /api/conversations/:id/archive`
- `PATCH /api/conversations/:id/restore`
- `GET /api/conversations/:id/comments`
- `POST /api/conversations/:id/comments`

Read `docs/journal.md` for the engineering decisions and learning notes.

## Junior SWE learning course

[Start the detailed Astra upskilling course](astraupskill/README.md): preserving workflow state and atomic multi-record changes, with a codebase map, worked implementation, executable examples, debugging labs, exercises and solution discussions.
