# Testing Strategy

Project: **Bookmark Manager** (`06-bookmark-manager`)

## Layers

| Layer | What belongs here | Anchor |
| --- | --- | --- |
| Unit | pure helpers and service branches | `server/src/services/service.ts:5` |
| API integration | route/controller/service/model contract | `server/src/routes/routes.ts:4` |
| DB/migration | schema constraints and seed assumptions | `server/db/migrations/001_init.ts:4` |
| UI | state, forms, rendering, error states | `client/src/App.tsx:17` |
| Contract/type | request and response shapes | `client/src/services/api.ts:4` |

## What Not To Test

Do not assert implementation details like internal hook state unless behavior requires it. Do test user-visible behavior and API contracts.

## Verification Notes

- Generated from inspected files in `06-bookmark-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
