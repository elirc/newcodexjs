# Domain Glossary

Project: **Bookmark Manager** (`06-bookmark-manager`)

## bookmark

Meaning in this project: a core domain term used to reason about bookmark organization, metadata, Zod validation, external consumers.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving bookmark.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## collection

Meaning in this project: a core domain term used to reason about bookmark organization, metadata, Zod validation, external consumers.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving collection.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## tag

Meaning in this project: a core domain term used to reason about bookmark organization, metadata, Zod validation, external consumers.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving tag.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## URL metadata

Meaning in this project: a core domain term used to reason about bookmark organization, metadata, Zod validation, external consumers.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving URL metadata.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## API version

Meaning in this project: a core domain term used to reason about bookmark organization, metadata, Zod validation, external consumers.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving API version.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## Verification Notes

- Generated from inspected files in `06-bookmark-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
