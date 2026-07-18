# System Map

Project: **Contact Book / Address Manager** (`02-contact-book`)

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
| UI | React page/components | `client/src/App.jsx:125` | Public user surface |
| Client API | HTTP contract wrapper | `client/src/services/api.js:4` | Internal client boundary |
| API app | middleware, health, route mount | `server/src/app.js:1` | Public HTTP surface |
| Routes | method/path contract | `server/src/routes/contactRoutes.js:5` | Public API contract |
| Controller | envelope and request parsing | `server/src/controllers/contactController.js:7` | Internal transport boundary |
| Service | invariants and business rules | `server/src/services/contactService.js:10` | Domain boundary |
| Model | Knex queries | `server/src/models/contactModel.js:1` | Persistence boundary |
| Data | migrations and seeds | `server/db/migrations/202607030201_create_contacts_tags.js:7`, `server/db/seeds/001_contacts.js:21` | Database contract |

Public interfaces are the browser UI and API routes. Private internals are service/model implementations, migration details, and UI state helpers.

## Verification Notes

- Generated from inspected files in `02-contact-book`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/contactRoutes.js`, `server/src/services/contactService.js`, `server/src/models/contactModel.js`, `server/db/migrations/202607030201_create_contacts_tags.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
