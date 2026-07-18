# Domain Glossary

Project: **Kanban Board** (`08-kanban-board`)

## board

Meaning in this project: a core domain term used to reason about board/list/card modeling, optimistic reorder, fractional positioning.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving board.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## list

Meaning in this project: a core domain term used to reason about board/list/card modeling, optimistic reorder, fractional positioning.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving list.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## card

Meaning in this project: a core domain term used to reason about board/list/card modeling, optimistic reorder, fractional positioning.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving card.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## label

Meaning in this project: a core domain term used to reason about board/list/card modeling, optimistic reorder, fractional positioning.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving label.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## position

Meaning in this project: a core domain term used to reason about board/list/card modeling, optimistic reorder, fractional positioning.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving position.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## checklist

Meaning in this project: a core domain term used to reason about board/list/card modeling, optimistic reorder, fractional positioning.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving checklist.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## Verification Notes

- Generated from inspected files in `08-kanban-board`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
