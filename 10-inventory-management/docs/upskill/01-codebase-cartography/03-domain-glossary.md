# Domain Glossary

Project: **Inventory Management System** (`10-inventory-management`)

## product

Meaning in this project: a core domain term used to reason about inventory transactions, stock movements, reporting, auditability.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving product.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## SKU

Meaning in this project: a core domain term used to reason about inventory transactions, stock movements, reporting, auditability.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving SKU.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## supplier

Meaning in this project: a core domain term used to reason about inventory transactions, stock movements, reporting, auditability.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving supplier.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## order

Meaning in this project: a core domain term used to reason about inventory transactions, stock movements, reporting, auditability.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving order.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## stock movement

Meaning in this project: a core domain term used to reason about inventory transactions, stock movements, reporting, auditability.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving stock movement.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## audit trail

Meaning in this project: a core domain term used to reason about inventory transactions, stock movements, reporting, auditability.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving audit trail.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## Verification Notes

- Generated from inspected files in `10-inventory-management`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
