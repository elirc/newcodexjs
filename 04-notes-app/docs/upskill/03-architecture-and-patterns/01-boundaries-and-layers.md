# Boundaries And Layers

Project: **Notes App** (`04-notes-app`)

| Layer | Owns | Must Not Own | Anchor |
| --- | --- | --- | --- |
| UI | rendering, local interaction | SQL, secrets | `client/src/App.jsx:18` |
| Client API | HTTP contract | domain rules | `client/src/services/api.js:4` |
| Routes | paths and verbs | business branching | `server/src/routes/routes.js:3` |
| Controllers | parsing and envelopes | persistence details | `server/src/controllers/controller.js:4` |
| Services | validation and invariants | raw HTTP concerns | `server/src/services/service.js:3` |
| Models | Knex queries | UI decisions | `server/src/models/model.js:1` |
| Migrations | durable schema | request logic | `server/db/migrations/001_init.js:2` |

Boundary leak to investigate: any validation duplicated inconsistently between UI and service.

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
