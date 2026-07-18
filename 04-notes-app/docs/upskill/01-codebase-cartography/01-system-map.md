# System Map

Project: **Notes App** (`04-notes-app`)

```text
client React UI
  -> client API service
  -> Express app/routes
  -> controller
  -> service/business rules
  -> model/Knex
  -> PostgreSQL tables + seed data
```

| Area | Owner | Anchor | Public or Private |
| --- | --- | --- | --- |
| UI | React page/components | `client/src/App.jsx:18` | Public user surface |
| Client API | HTTP contract wrapper | `client/src/services/api.js:4` | Internal client boundary |
| API app | middleware, health, route mount | `server/src/app.js:2` | Public HTTP surface |
| Routes | method/path contract | `server/src/routes/routes.js:3` | Public API contract |
| Controller | envelope and request parsing | `server/src/controllers/controller.js:4` | Internal transport boundary |
| Service | invariants and business rules | `server/src/services/service.js:3` | Domain boundary |
| Model | Knex queries | `server/src/models/model.js:1` | Persistence boundary |
| Data | migrations and seeds | `server/db/migrations/001_init.js:2`, `server/db/seeds/001_seed.js:3` | Database contract |

Public interfaces are the browser UI and API routes. Private internals are service/model implementations, migration details, and UI state helpers.

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
