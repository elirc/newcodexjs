# Learning Management System

Large full-stack TypeScript learning app using the same core stack as the earlier projects: React 18, Vite, CSS Modules, Express, PostgreSQL, and Knex.

## Enterprise Features

- school-scoped course catalog
- publication lifecycle
- review comments
- saved instructor views
- bulk course status operations
- audit log for curriculum changes
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

Server defaults to `http://localhost:4118`.

## API Highlights

- `GET /api/courses?page=1&pageSize=25&status=...`
- `GET /api/courses/dashboard`
- `GET /api/courses/audit`
- `GET /api/courses/views`
- `POST /api/courses/views`
- `POST /api/courses/bulk/status`
- `PATCH /api/courses/:id/archive`
- `PATCH /api/courses/:id/restore`
- `GET /api/courses/:id/comments`
- `POST /api/courses/:id/comments`

Read `docs/journal.md` for the engineering decisions and learning notes.

## Junior SWE learning course

[Start the detailed Astra upskilling course](astraupskill/README.md): preserving workflow state and atomic multi-record changes, with a codebase map, worked implementation, executable examples, debugging labs, exercises and solution discussions.
