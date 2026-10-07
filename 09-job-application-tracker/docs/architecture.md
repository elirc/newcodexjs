# Job Application Tracker Architecture

> Grounded in source read on 2026-10-06. Citations are `path:line` from the project root.

## What this project really is

The server is the **shared generic single-resource CRUD scaffold** also used by
`07-blog-platform`, `08-kanban-board` and `10-inventory-management`. A `diff -r` of the
four `server/` folders shows only the table name, field names, port, database name,
seed rows, extra unused dependencies and mount path differ. Here the resource is
`applications`, mounted at `/api/applications` (`server/src/app.ts:33`) on port 4109
(`server/src/config/env.ts:8`).

The tracker behaviour the name implies is **not implemented**: there is no stage
state machine, no stage-history table, no transactions, no resume upload and no KPI
queries beyond a count per `status`. `stage` is a text `<input>`
(`client/src/App.tsx:173`). `server/package.json:22` to `server/package.json:24`
declare `multer`, `nodemailer` and `date-fns` (and `client/package.json:18` repeats
these server libraries in the client), but nothing under `server/src` or `client/src`
imports them. Those features are the labs in `docs/FABLE.md`.

## Folder structure

- `client/`: Vite + React 18 single page (`client/src/App.tsx`) styled with a CSS Module (`client/src/App.module.css`); HTTP lives in `client/src/services/api.ts`. The client has no test script or test files.
- `server/`: Express API with routes → controller → service → model layers under `server/src/`.
- `server/db/migrations/`: one reversible migration (`up` and `down`) for PostgreSQL.
- `server/db/seeds/`: three sample applications (`server/db/seeds/001_seed.ts:5`).
- `test/`: API tests run with `tsx --test` against a real Postgres schema (`server/package.json:11`).

## Request flow (create an application)

1. `client/src/App.tsx:72` `saveRecord` calls `createRecord(form)` at `client/src/App.tsx:81`.
2. `client/src/services/api.ts:39` posts JSON to `/applications` on the base URL from `client/src/services/api.ts:5`.
3. Global middleware in order: `helmet` (`server/src/app.ts:13`), CORS (`server/src/app.ts:14`), `morgan` (`server/src/app.ts:15`), `express.json` (`server/src/app.ts:16`), then a guard rejecting non-object bodies (`server/src/app.ts:17`).
4. `server/src/routes/routes.ts:10` maps `POST /` to the controller through `wrap` (`server/src/routes/routes.ts:5`), which forwards rejected promises to `next`.
5. `server/src/controllers/controller.ts:17` passes `req.body` to the service and replies 201.
6. `server/src/services/service.ts:52` runs `parsePayload` (`server/src/services/service.ts:22`), a Zod `safeParse` of `recordSchema` (`server/src/services/service.ts:4`). Unknown keys are dropped; tags are trimmed and de-duplicated case-insensitively (last spelling wins).
7. `server/src/models/model.ts:24` inserts with `.returning("*")`; `databasePayload` (`server/src/models/model.ts:58`) JSON-stringifies `tags` for the `jsonb` column.
8. The table comes from `server/db/migrations/001_init.ts:4`. The response is wrapped by `sendSuccess` (`server/src/utils/response.ts:4`) as `{ success: true, data }`.

`GET /stats` is registered before `GET /:id` (`server/src/routes/routes.ts:8`), otherwise "stats" would hit `parseId` and return 400. `PUT` is a **partial** update: the schema is made `.partial()` (`server/src/services/service.ts:23`).

## Auth and access control

There is none. A grep for `jwt|token|cookie|session|auth` across `server/src` and
`client/src` only hits `rejectUnauthorized` in the SSL option (`server/src/config/env.ts:17`).
What exists: CORS limited to `CLIENT_ORIGIN` with `credentials: true`
(`server/src/app.ts:14`) and `helmet` headers. Consequence: every application is
visible to and editable by anyone who can reach port 4109; there is no notion of
whose job search it is.

## Database shape

From `server/db/migrations/001_init.ts:4`:

| Column | Type | Constraint |
|---|---|---|
| `id` | serial (`increments`) | primary key |
| `company` | varchar(255) | not null |
| `role` | varchar(255) | not null |
| `stage` | varchar(255) | not null, free text |
| `status` | varchar(255) | not null, free text |
| `tags` | jsonb | not null, default `[]` |
| `created_at`, `updated_at` | Knex `timestamps(true, true)` | default now |

`tags` is `jsonb`, not `json` (the earlier version of this doc said `json`).

## Design decisions

- One main domain workflow (flat `applications` CRUD) so the layers are easy to inspect.
- Migration plus seed data so SQL behaviour can be studied before the UI is touched.
- The same conventions as the sibling projects. Here the conventions are identical code, not just the same style.

## Senior findings (verified 2026-10-06 by reading source)

1. **`stage` is a field, not a state machine.** `server/src/services/service.ts:7` accepts any 1-255 character string, and a partial `PUT` can jump `applied` straight to `accepted` or to a typo like `intervew`. The list card shows company, role and status but never stage (`client/src/App.tsx:221`), and stats group only by `status` (`server/src/models/model.ts:47`). Fix: a `TRANSITIONS` map, a `POST /:id/transition` endpoint returning 409 on illegal moves, and `stage` removed from the PUT schema.
2. **No history, so no timeline or funnel.** There is a single migration and table (`server/db/migrations/001_init.ts:4`); an update overwrites the row and bumps `updated_at` (`server/src/models/model.ts:37`), and no `transaction` call exists in `server/src`. Once a stage changes, when and from what is lost. Fix: a `stage_history` table written in the same `knex.transaction` as the update.
3. **Search and list are unbounded and wildcard-prone.** `server/src/models/model.ts:13` interpolates the raw term into `%...%`, so `_` or `%` match every application (parameterized, so not SQL injection), and no `limit` exists. Sibling project 06 escapes them (`../../06-bookmark-manager/server/src/models/model.ts:7`).
4. **Error mapping is lossy.** `server/src/middleware/errorMiddleware.ts:11` turns any non-`AppError` into a 500 (default at `server/src/utils/errors.ts:4`) carrying the raw message, and the object guard sends `error` as a plain string (`server/src/app.ts:24`), not the `{ message, code }` shape read at `client/src/services/api.ts:15`. Fix: honour `error.status` for 4xx, genericize 5xx, use one envelope.

## Debugging scenario

*"My `curl` with a typo in the JSON returns 500, not 400."* `express.json`
(`server/src/app.ts:16`) throws a parse error that carries a 400 status, but
`errorMiddleware` (`server/src/middleware/errorMiddleware.ts:5`) only trusts
`AppError`, so it builds `new AppError(error.message)` whose status defaults to 500
(`server/src/utils/errors.ts:4`). The parser's message is returned to the caller.
Fix it as in finding 4 and add a test that posts `{bad json` and expects 400.

## Growth ladder

1. **Goal:** trace one request end to end. **Check:** `grep -n "orWhereILike" server/src/models/model.ts` prints line 13, and you can say why `/stats` must precede `/:id`.
2. **Goal:** run the API tests. **Check (run locally, needs Postgres):** set `ASTRA_TEST_DATABASE_URL` to a database whose name starts with `astra_test_` (enforced at `test/database.ts:13`) and run `npm test` from the project root. Expect four passing tests, including "malformed create and edits return 400 without changing stored data".
3. **Goal:** fix error mapping. **Check:** your new malformed-JSON test returns 400 and the body has `error.code`.
4. **Goal:** stage state machine. **Check:** a test walks `applied` to `accepted` through legal transitions and gets 409 for `applied` to `offer`; a plain `PUT { "stage": "accepted" }` is rejected.
5. **Goal:** transactional stage history. **Check:** `grep -rn "transaction" server/src` currently prints nothing; after your change it matches, and `GET /api/applications/:id/history` lists one row per transition.

## Review prompts

- Which code belongs in controllers, services and models? (Here the controller does no validation; the service owns all of it.)
- Which validation belongs on the client, and which must be repeated on the server? (The client does none; every rule is in `recordSchema`.)
- How would this schema change when adding authentication or multi-user ownership? (Add an owner column and filter every model query by it.)
