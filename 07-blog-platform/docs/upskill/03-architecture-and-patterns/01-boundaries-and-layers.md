# Boundaries And Layers

Project: **Blog Platform** (`07-blog-platform`)

| Layer | Owns | Must Not Own | Anchor |
| --- | --- | --- | --- |
| UI | rendering, local interaction | SQL, secrets | `client/src/App.tsx:17` |
| Client API | HTTP contract | domain rules | `client/src/services/api.ts:4` |
| Routes | paths and verbs | business branching | `server/src/routes/routes.ts:4` |
| Controllers | parsing and envelopes | persistence details | `server/src/controllers/controller.ts:6` |
| Services | validation and invariants | raw HTTP concerns | `server/src/services/service.ts:5` |
| Models | Knex queries | UI decisions | `server/src/models/model.ts:1` |
| Migrations | durable schema | request logic | `server/db/migrations/001_init.ts:4` |

Boundary leak to investigate: any validation duplicated inconsistently between UI and service.

## Verification Notes

- Generated from inspected files in `07-blog-platform`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
