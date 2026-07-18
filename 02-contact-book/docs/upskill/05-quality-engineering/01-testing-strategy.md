# Testing Strategy

Project: **Contact Book / Address Manager** (`02-contact-book`)

## Layers

| Layer | What belongs here | Anchor |
| --- | --- | --- |
| Unit | pure helpers and service branches | `server/src/services/contactService.js:10` |
| API integration | route/controller/service/model contract | `server/src/routes/contactRoutes.js:5` |
| DB/migration | schema constraints and seed assumptions | `server/db/migrations/202607030201_create_contacts_tags.js:7` |
| UI | state, forms, rendering, error states | `client/src/App.jsx:125` |
| Contract/type | request and response shapes | `client/src/services/api.js:4` |

## What Not To Test

Do not assert implementation details like internal hook state unless behavior requires it. Do test user-visible behavior and API contracts.

## Verification Notes

- Generated from inspected files in `02-contact-book`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/contactRoutes.js`, `server/src/services/contactService.js`, `server/src/models/contactModel.js`, `server/db/migrations/202607030201_create_contacts_tags.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
