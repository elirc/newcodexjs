# Testing Strategy

Project: **Notes App** (`04-notes-app`)

## Layers

| Layer | What belongs here | Anchor |
| --- | --- | --- |
| Unit | pure helpers and service branches | `server/src/services/service.js:3` |
| API integration | route/controller/service/model contract | `server/src/routes/routes.js:3` |
| DB/migration | schema constraints and seed assumptions | `server/db/migrations/001_init.js:2` |
| UI | state, forms, rendering, error states | `client/src/App.jsx:18` |
| Contract/type | request and response shapes | `client/src/services/api.js:4` |

## What Not To Test

Do not assert implementation details like internal hook state unless behavior requires it. Do test user-visible behavior and API contracts.

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
