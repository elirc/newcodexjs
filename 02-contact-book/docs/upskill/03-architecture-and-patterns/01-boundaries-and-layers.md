# Boundaries And Layers

Project: **Contact Book / Address Manager** (`02-contact-book`)

| Layer | Owns | Must Not Own | Anchor |
| --- | --- | --- | --- |
| UI | rendering, local interaction | SQL, secrets | `client/src/App.jsx:125` |
| Client API | HTTP contract | domain rules | `client/src/services/api.js:4` |
| Routes | paths and verbs | business branching | `server/src/routes/contactRoutes.js:5` |
| Controllers | parsing and envelopes | persistence details | `server/src/controllers/contactController.js:7` |
| Services | validation and invariants | raw HTTP concerns | `server/src/services/contactService.js:10` |
| Models | Knex queries | UI decisions | `server/src/models/contactModel.js:1` |
| Migrations | durable schema | request logic | `server/db/migrations/202607030201_create_contacts_tags.js:7` |

Boundary leak to investigate: any validation duplicated inconsistently between UI and service.

## Verification Notes

- Generated from inspected files in `02-contact-book`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/contactRoutes.js`, `server/src/services/contactService.js`, `server/src/models/contactModel.js`, `server/db/migrations/202607030201_create_contacts_tags.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
