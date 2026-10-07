# Inventory Management Architecture

> Grounded in source read on 2026-10-06. Citations are `path:line` from the project root.

## What this project really is

The server is the **shared generic single-resource CRUD scaffold** also used by
`07-blog-platform`, `08-kanban-board` and `09-job-application-tracker`. A `diff -r` of
the four `server/` folders shows only the table name, field names, port, database
name, seed rows, extra dependencies and mount path differ. Here the resource is
`products`, mounted at `/api/products` (`server/src/app.ts:33`) on port 4110
(`server/src/config/env.ts:8`).

The inventory behaviour the name implies is **not implemented**: there is no
quantity column, no stock movements or ledger, no purchase or sales orders, no
transactions and no reports beyond a count per `status`. The seed tag `low-stock`
(`server/db/seeds/001_seed.ts:12`) is only a label. Those features are the labs in
`docs/FABLE.md`. Unlike projects 07-09, this project's `package.json` files add no
unused domain libraries.

## Folder structure

- `client/`: Vite + React 18 single page (`client/src/App.tsx`) styled with a CSS Module (`client/src/App.module.css`); HTTP lives in `client/src/services/api.ts`. The client has no test script or test files.
- `server/`: Express API with routes → controller → service → model layers under `server/src/`.
- `server/db/migrations/`: one reversible migration (`up` and `down`) for PostgreSQL.
- `server/db/seeds/`: three sample products (`server/db/seeds/001_seed.ts:5`).
- `test/`: API tests run with `tsx --test` against a real Postgres schema (`server/package.json:11`).

## Request flow (create a product)

1. `client/src/App.tsx:72` `saveRecord` calls `createRecord(form)` at `client/src/App.tsx:81`.
2. `client/src/services/api.ts:39` posts JSON to `/products` on the base URL from `client/src/services/api.ts:5`.
3. Global middleware in order: `helmet` (`server/src/app.ts:13`), CORS (`server/src/app.ts:14`), `morgan` (`server/src/app.ts:15`), `express.json` (`server/src/app.ts:16`), then a guard rejecting non-object bodies (`server/src/app.ts:17`).
4. `server/src/routes/routes.ts:10` maps `POST /` to the controller through `wrap` (`server/src/routes/routes.ts:5`), which forwards rejected promises to `next`.
5. `server/src/controllers/controller.ts:17` passes `req.body` to the service and replies 201.
6. `server/src/services/service.ts:52` runs `parsePayload` (`server/src/services/service.ts:22`), a Zod `safeParse` of `recordSchema` (`server/src/services/service.ts:4`). Unknown keys are dropped (so a `quantity` field is silently discarded); tags are trimmed and de-duplicated case-insensitively (last spelling wins).
7. `server/src/models/model.ts:24` inserts with `.returning("*")`; `databasePayload` (`server/src/models/model.ts:58`) JSON-stringifies `tags` for the `jsonb` column.
8. The table comes from `server/db/migrations/001_init.ts:4`. The response is wrapped by `sendSuccess` (`server/src/utils/response.ts:4`) as `{ success: true, data }`.

`GET /stats` is registered before `GET /:id` (`server/src/routes/routes.ts:8`), otherwise "stats" would hit `parseId` and return 400. `PUT` is a **partial** update: the schema is made `.partial()` (`server/src/services/service.ts:23`).

## Auth and access control

There is none. A grep for `jwt|token|cookie|session|auth` across `server/src` and
`client/src` only hits `rejectUnauthorized` in the SSL option (`server/src/config/env.ts:17`).
What exists: CORS limited to `CLIENT_ORIGIN` with `credentials: true`
(`server/src/app.ts:14`) and `helmet` headers. Consequence: anyone who can reach port
4110 can rename or delete any product; CORS only restrains browsers, not `curl`.

## Database shape

From `server/db/migrations/001_init.ts:4`:

| Column | Type | Constraint |
|---|---|---|
| `id` | serial (`increments`) | primary key |
| `sku` | varchar(255) | not null, **not unique** |
| `name` | varchar(255) | not null |
| `category` | varchar(255) | not null, free text |
| `status` | varchar(255) | not null, free text |
| `tags` | jsonb | not null, default `[]` |
| `created_at`, `updated_at` | Knex `timestamps(true, true)` | default now |

`tags` is `jsonb`, not `json` (the earlier version of this doc said `json`).

## Design decisions

- One main domain workflow (flat `products` CRUD) so the layers are easy to inspect.
- Migration plus seed data so SQL behaviour can be studied before the UI is touched.
- The same conventions as the sibling projects. Here the conventions are identical code, not just the same style.

## Senior findings (verified 2026-10-06 by reading source)

1. **An inventory system with no stock.** The only table (`server/db/migrations/001_init.ts:4`) has no quantity, cost or reorder level, and the schema at `server/src/services/service.ts:4` would drop such a field anyway. Nothing can answer "how many do we have?". Fix: an append-only `stock_movements` table with signed deltas, on-hand quantity derived by `SUM`, written in transactions.
2. **SKU is not unique.** `server/db/migrations/001_init.ts:6` has no unique index and `server/src/services/service.ts:5` accepts any string, so two products can both be `HD-001`; any future movement keyed by SKU becomes ambiguous. Fix: unique index (consider case-insensitive), map Postgres error `23505` to 409.
3. **`_` in a search is a wildcard.** `server/src/models/model.ts:13` interpolates the raw term into `%...%`. It is parameterized, so not SQL injection, but SKUs often contain `_`. Searching `HD_001` also matches `HD-001`. The list has no `limit` either. Sibling project 06 escapes metacharacters (`../../06-bookmark-manager/server/src/models/model.ts:7`).
4. **Hard delete.** `server/src/models/model.ts:43` removes the row outright. Today that is harmless, but once movements reference products it either fails on a foreign key or orphans the audit trail. Fix: soft delete (`deleted_at` or `status = 'discontinued'`) and `ON DELETE RESTRICT` on the ledger.

## Debugging scenario

*"I searched for `HD_001` and got `HD-001` too."* The client sends `search` from
`client/src/App.tsx:34` via `listRecords` (`client/src/services/api.ts:33`), the service
only checks it is a string of at most 255 characters (`server/src/services/service.ts:36`),
and the model wraps it as `%HD_001%` for `ILIKE` across `sku`, `name`, `category` and
`status` (`server/src/models/model.ts:12`). In `LIKE`, `_` matches any single
character, so the `-` in `HD-001` matches. Escape `\`, `%` and `_` and use
`ESCAPE '\'`, as project 06 does.

## Growth ladder

1. **Goal:** trace one request end to end. **Check:** `grep -n "orWhereILike" server/src/models/model.ts` prints line 13, and you can say why `/stats` must precede `/:id`.
2. **Goal:** run the API tests. **Check (run locally, needs Postgres):** set `ASTRA_TEST_DATABASE_URL` to a database whose name starts with `astra_test_` (enforced at `test/database.ts:13`) and run `npm test` from the project root. Expect four passing tests, including "tags serialize as JSON arrays and filters compose with stable ordering".
3. **Goal:** escape LIKE metacharacters and enforce unique SKUs. **Check:** `grep -n "ESCAPE" server/src/models/model.ts` and `grep -rn "unique" server/db/migrations/` both print nothing today; after your change both match, `search=HD_001` no longer returns `HD-001`, and a duplicate-SKU POST returns 409.
4. **Goal:** movement ledger. **Check:** `grep -rn "quantity" server/db/migrations/` currently prints nothing; after a new migration it matches, and a test posts +20 then -3 and reads on-hand 17.
5. **Goal:** concurrency-safe decrement. **Check:** `grep -rn "transaction" server/src` currently prints nothing; after your change it matches, and a `Promise.all` test of two sales of 5 units each, with 5 on hand, ends with on-hand 0 and exactly one sale rejected.

## Review prompts

- Which code belongs in controllers, services and models? (Here the controller does no validation; the service owns all of it.)
- Which validation belongs on the client, and which must be repeated on the server? (The client does none; every rule is in `recordSchema`.)
- How would this schema change when adding authentication or multi-user ownership? (Add a warehouse or owner column and record who made each movement.)
