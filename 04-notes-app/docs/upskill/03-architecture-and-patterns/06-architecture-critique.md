# Architecture Critique

Project: **Notes App** (`04-notes-app`)

## Strong Choices

- Clear client/server split.
- Layered API path from routes to controllers to services to models.
- Versioned migrations and seed data.
- Local-first learning commands.

## Risks And Tradeoffs

| Risk | Evidence | Impact | Confidence |
| --- | --- | --- | --- |
| Missing or light test coverage | No test files confirmed in this pass | regressions can slip | medium |
| Demo auth or no auth | inspect `server/src/routes/routes.js:3` and auth middleware if present | IDOR risk in real apps | medium |
| Unbounded list endpoints | inspect `server/src/models/model.js:1` | latency and memory risk | medium |
| Thin observability | inspect `server/src/app.js:2` and `server/src/middleware/errorMiddleware.js:1` | debugging production issues is harder | medium |

## If I Owned This For Three Months

1. Add API integration tests for create/update/delete.
2. Add pagination and indexes for list endpoints.
3. Add explicit auth/ownership checks where user data exists.
4. Add structured logging around errors and slow queries.
5. Write schema migration playbooks.

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
