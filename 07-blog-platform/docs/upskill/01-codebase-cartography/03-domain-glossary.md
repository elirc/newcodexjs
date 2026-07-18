# Domain Glossary

Project: **Blog Platform** (`07-blog-platform`)

## post

Meaning in this project: a core domain term used to reason about posts, nested comments, rich text, RSS, sanitization.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving post.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## comment

Meaning in this project: a core domain term used to reason about posts, nested comments, rich text, RSS, sanitization.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving comment.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## reply

Meaning in this project: a core domain term used to reason about posts, nested comments, rich text, RSS, sanitization.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving reply.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## slug

Meaning in this project: a core domain term used to reason about posts, nested comments, rich text, RSS, sanitization.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving slug.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## RSS

Meaning in this project: a core domain term used to reason about posts, nested comments, rich text, RSS, sanitization.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving RSS.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## sanitized HTML

Meaning in this project: a core domain term used to reason about posts, nested comments, rich text, RSS, sanitization.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving sanitized HTML.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## Verification Notes

- Generated from inspected files in `07-blog-platform`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
