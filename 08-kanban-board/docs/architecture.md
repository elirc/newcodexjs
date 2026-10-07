# Kanban Board Architecture

> Grounded in source read on 2026-10-06. Citations are `path:line` from the project root.

## What this project really is

The server is the **shared generic single-resource CRUD scaffold** also used by
`07-blog-platform`, `09-job-application-tracker` and `10-inventory-management`. A
`diff -r` of the four `server/` folders shows only the table name, field names, port,
database name, seed rows, extra unused dependencies and mount path differ. Here the
resource is `cards`, mounted at `/api/cards` (`server/src/app.ts:33`) on port 4108
(`server/src/config/env.ts:8`).

The kanban behaviour the name implies is **not implemented**: there are no boards or
lists tables, no `position` column, no drag-and-drop and no move endpoint. A card's
lane is just a text field typed into an `<input>` (`client/src/App.tsx:173`).
`server/package.json:22` and `client/package.json:18` declare `@dnd-kit/*`, but nothing
under `server/src` or `client/src` imports it. Those features are the labs in
`docs/FABLE.md`.

## Folder structure

- `client/`: Vite + React 18 single page (`client/src/App.tsx`) styled with a CSS Module (`client/src/App.module.css`); HTTP lives in `client/src/services/api.ts`. The client has no test script or test files.
- `server/`: Express API with routes → controller → service → model layers under `server/src/`.
- `server/db/migrations/`: one reversible migration (`up` and `down`) for PostgreSQL.
- `server/db/seeds/`: three sample cards, one per lane (`server/db/seeds/001_seed.ts:5`).
- `test/`: API tests run with `tsx --test` against a real Postgres schema (`server/package.json:11`).

## Request flow (create a card)

1. `client/src/App.tsx:72` `saveRecord` calls `createRecord(form)` at `client/src/App.tsx:81`.
2. `client/src/services/api.ts:39` posts JSON to `/cards` on the base URL from `client/src/services/api.ts:5`.
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
(`server/src/app.ts:14`) and `helmet` headers. Consequence: anyone who can reach port
4108 can move or delete any card; CORS only restrains browsers, not `curl`.

## Database shape

From `server/db/migrations/001_init.ts:4`:

| Column | Type | Constraint |
|---|---|---|
| `id` | serial (`increments`) | primary key |
| `title` | varchar(255) | not null |
| `body` | text | nullable (service defaults to `""`) |
| `lane` | varchar(255) | not null, free text |
| `status` | varchar(255) | not null, free text |
| `tags` | jsonb | not null, default `[]` |
| `created_at`, `updated_at` | Knex `timestamps(true, true)` | default now |

`tags` is `jsonb`, not `json` (the earlier version of this doc said `json`).

## Design decisions

- One main domain workflow (flat `cards` CRUD) so the layers are easy to inspect.
- Migration plus seed data so SQL behaviour can be studied before the UI is touched.
- The same conventions as the sibling projects. Here the conventions are identical code, not just the same style.

## Senior findings (verified 2026-10-06 by reading source)

1. **Cards have no order.** The migration has no position column (`server/db/migrations/001_init.ts:4`), and the list is sorted by `created_at desc` (`server/src/models/model.ts:7`). A user cannot reorder a lane; a new card always jumps to the top. Fix: `position` (numeric or fractional string key) per lane, `ORDER BY lane, position`, and a single-row move update.
2. **`lane` and `status` can contradict each other.** Both are independent free strings (`server/src/services/service.ts:7`, `server/src/services/service.ts:8`), so `lane: "done", status: "todo"` is accepted. Stats group only by `status` (`server/src/models/model.ts:47`), and the card list shows `status` but never `lane` (`client/src/App.tsx:221`). Fix: pick one column as the source of truth, constrain it (enum or `lanes` foreign key), and drop or derive the other.
3. **Search and list are unbounded and wildcard-prone.** `server/src/models/model.ts:13` interpolates the raw term into `%...%`, so `_` or `%` match every card (parameterized, so not SQL injection), and no `limit` exists. Sibling project 06 escapes them (`../../06-bookmark-manager/server/src/models/model.ts:7`).
4. **Error mapping is lossy.** `server/src/middleware/errorMiddleware.ts:11` turns any non-`AppError` into a 500 (default at `server/src/utils/errors.ts:4`) carrying the raw message, so malformed JSON becomes a 500 and database errors leak their text. The object guard sends `error` as a plain string (`server/src/app.ts:24`), not the `{ message, code }` shape the client reads at `client/src/services/api.ts:15`. Fix: honour `error.status` for 4xx, genericize 5xx, use one envelope.

## Debugging scenario

*"I moved a card to `done` but stats still count it as `todo`."* Editing the lane
sends `PUT /api/cards/:id` with the form; if only `{ "lane": "done" }` is sent
(`curl`), the partial schema (`server/src/services/service.ts:23`) leaves `status`
untouched, `updateRecord` (`server/src/models/model.ts:31`) changes only `lane`, and
`stats()` still groups that card under `todo`. Nothing is broken in the code; the data
model has two sources of truth (finding 2).

## Growth ladder

1. **Goal:** trace one request end to end. **Check:** `grep -n "orWhereILike" server/src/models/model.ts` prints line 13, and you can say why `/stats` must precede `/:id`.
2. **Goal:** run the API tests. **Check (run locally, needs Postgres):** set `ASTRA_TEST_DATABASE_URL` to a database whose name starts with `astra_test_` (enforced at `test/database.ts:13`) and run `npm test` from the project root. Expect four passing tests, including "create/read/partial update preserves identity and omitted fields".
3. **Goal:** make lane the single source of truth. **Check:** a test that PUTs `{ "lane": "done" }` then reads `/api/cards/stats` sees the card counted under `done`.
4. **Goal:** ordering. **Check:** `grep -rn "position" server/db/migrations/` currently prints nothing; after a new migration it matches, and a test creates three cards, moves the last between the first two, and asserts list order.
5. **Goal:** drag-and-drop with optimistic rollback. **Check:** `grep -rn "@dnd-kit" client/src` currently prints nothing; after wiring it matches, and with the API stopped a dropped card snaps back and shows an error.

## Review prompts

- Which code belongs in controllers, services and models? (Here the controller does no validation; the service owns all of it.)
- Which validation belongs on the client, and which must be repeated on the server? (The client does none; every rule is in `recordSchema`.)
- How would this schema change when adding authentication or multi-user ownership? (Boards would need an owner, and every card query would filter through its board.)
