# Architecture Critique

Project: **Job Application Tracker** (`09-job-application-tracker`)

## Strong Choices

- Clear client/server split.
- Layered API path from routes to controllers to services to models.
- Versioned migrations and seed data.
- Local-first learning commands.

## Risks And Tradeoffs

| Risk | Evidence | Impact | Confidence |
| --- | --- | --- | --- |
| Missing or light test coverage | No test files confirmed in this pass | regressions can slip | medium |
| Demo auth or no auth | inspect `server/src/routes/routes.ts:4` and auth middleware if present | IDOR risk in real apps | medium |
| Unbounded list endpoints | inspect `server/src/models/model.ts:1` | latency and memory risk | medium |
| Thin observability | inspect `server/src/app.ts:2` and `server/src/middleware/errorMiddleware.ts:2` | debugging production issues is harder | medium |

## If I Owned This For Three Months

1. Add API integration tests for create/update/delete.
2. Add pagination and indexes for list endpoints.
3. Add explicit auth/ownership checks where user data exists.
4. Add structured logging around errors and slow queries.
5. Write schema migration playbooks.

## Verification Notes

- Generated from inspected files in `09-job-application-tracker`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
