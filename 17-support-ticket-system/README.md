# Customer Support Ticket System

Large full-stack TypeScript learning app using the same core stack as the earlier projects: React 18, Vite, CSS Modules, Express, PostgreSQL, and Knex.

## Enterprise Features

- team-scoped ticket queues
- SLA and priority metadata
- internal comments
- saved triage views
- bulk assignment/status movement
- audit trail for customer-impacting actions
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

Server defaults to `http://localhost:4117`.

## API Highlights

- `GET /api/tickets?page=1&pageSize=25&status=...`
- `GET /api/tickets/dashboard`
- `GET /api/tickets/audit`
- `GET /api/tickets/views`
- `POST /api/tickets/views`
- `POST /api/tickets/bulk/status`
- `PATCH /api/tickets/:id/archive`
- `PATCH /api/tickets/:id/restore`
- `GET /api/tickets/:id/comments`
- `POST /api/tickets/:id/comments`

Read `docs/journal.md` for the engineering decisions and learning notes.
