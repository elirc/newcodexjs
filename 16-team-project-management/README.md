# Team Project Management

Large full-stack TypeScript learning app using the same core stack as the earlier projects: React 18, Vite, CSS Modules, Express, PostgreSQL, and Knex.

## Enterprise Features

- workspace-scoped project/task records
- saved views for team dashboards
- comment threads for collaboration
- bulk workflow updates
- archive/restore lifecycle
- audit log for reviewability
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

Server defaults to `http://localhost:4116`.

## API Highlights

- `GET /api/tasks?page=1&pageSize=25&status=...`
- `GET /api/tasks/dashboard`
- `GET /api/tasks/audit`
- `GET /api/tasks/views`
- `POST /api/tasks/views`
- `POST /api/tasks/bulk/status`
- `PATCH /api/tasks/:id/archive`
- `PATCH /api/tasks/:id/restore`
- `GET /api/tasks/:id/comments`
- `POST /api/tasks/:id/comments`

Read `docs/journal.md` for the engineering decisions and learning notes.

## Junior SWE learning course

[Start the detailed Astra upskilling course](astraupskill/README.md): preserving workflow state and atomic multi-record changes, with a codebase map, worked implementation, executable examples, debugging labs, exercises and solution discussions.
