# Blog Platform Architecture

> Grounded in source read on 2026-10-06. Citations are `path:line` from the project root.

## What this project really is

The server is the **shared generic single-resource CRUD scaffold** also used by
`08-kanban-board`, `09-job-application-tracker` and `10-inventory-management`. A
`diff -r` of the four `server/` folders shows only the table name, field names, port,
database name, seed rows, extra unused dependencies and mount path differ. Here the
resource is `posts`, mounted at `/api/posts` (`server/src/app.ts:33`) on port 4107
(`server/src/config/env.ts:8`).

The blog behaviour the name implies is **not implemented**: there is no slug
generation or uniqueness, no draft/published visibility rule, no HTML sanitization,
no comments table and no RSS route. `server/package.json:22` to `server/package.json:26`
declare `@tiptap/*`, `dompurify`, `slugify` and `rss`, but nothing under `server/src`
or `client/src` imports them. Those features are the labs in `docs/FABLE.md`.

## Folder structure

- `client/`: Vite + React 18 single page (`client/src/App.tsx`) styled with a CSS Module (`client/src/App.module.css`); HTTP lives in `client/src/services/api.ts`.
- `server/`: Express API with routes → controller → service → model layers under `server/src/`.
- `server/db/migrations/`: one reversible migration (`up` and `down`) for PostgreSQL.
- `server/db/seeds/`: three sample posts (`server/db/seeds/001_seed.ts:5`).
- `test/`: API tests run with `tsx --test` against a real Postgres schema (`server/package.json:11`).

## Request flow (create a post)

1. `client/src/App.tsx:72` `saveRecord` calls `createRecord(form)` at `client/src/App.tsx:81`.
2. `client/src/services/api.ts:39` posts JSON to `/posts` on the base URL from `client/src/services/api.ts:5`.
3. Global middleware in order: `helmet` (`server/src/app.ts:13`), CORS (`server/src/app.ts:14`), `morgan` (`server/src/app.ts:15`), `express.json` (`server/src/app.ts:16`), then a guard rejecting non-object bodies (`server/src/app.ts:17`).
4. `server/src/routes/routes.ts:10` maps `POST /` to the controller through `wrap` (`server/src/routes/routes.ts:5`), which forwards rejected promises to `next`.
5. `server/src/controllers/controller.ts:17` passes `req.body` to the service and replies 201.
6. `server/src/services/service.ts:52` runs `parsePayload` (`server/src/services/service.ts:22`), a Zod `safeParse` of `recordSchema` (`server/src/services/service.ts:4`). Unknown keys are dropped; tags are trimmed and de-duplicated case-insensitively (last spelling wins).
7. `server/src/models/model.ts:24` inserts with `.returning("*")`; `databasePayload` (`server/src/models/model.ts:58`) JSON-stringifies `tags` for the `jsonb` column.
8. The table comes from `server/db/migrations/001_init.ts:4`. The response is wrapped by `sendSuccess` (`server/src/utils/response.ts:4`) as `{ success: true, data }`.

Note `GET /stats` is registered before `GET /:id` (`server/src/routes/routes.ts:8`), otherwise "stats" would hit `parseId` and return 400. `PUT` is a **partial** update: the schema is made `.partial()` (`server/src/services/service.ts:23`).

## Auth and access control

There is none. A grep for `jwt|token|cookie|session|auth` across `server/src` and
`client/src` only hits `rejectUnauthorized` in the SSL option (`server/src/config/env.ts:17`).
What exists: CORS limited to `CLIENT_ORIGIN` with `credentials: true`
(`server/src/app.ts:14`) and `helmet` headers. Consequence: anyone who can reach port
4107 can create, edit or delete any post; CORS only restrains browsers, not `curl`.

## Database shape

From `server/db/migrations/001_init.ts:4`:

| Column | Type | Constraint |
|---|---|---|
| `id` | serial (`increments`) | primary key |
| `title` | varchar(255) | not null |
| `body` | text | nullable (service defaults to `""`) |
| `slug` | varchar(255) | not null, **not unique** |
| `status` | varchar(255) | not null, free text |
| `tags` | jsonb | not null, default `[]` |
| `created_at`, `updated_at` | Knex `timestamps(true, true)` | default now |

`tags` is `jsonb`, not `json` (the earlier version of this doc said `json`).

## Design decisions

- One main domain workflow (flat `posts` CRUD) so the layers are easy to inspect.
- Migration plus seed data so SQL behaviour can be studied before the UI is touched.
- The same conventions as the sibling projects, so each new app adds concepts without changing the mental model. Here the conventions are identical code, not just the same style.

## Senior findings (verified 2026-10-06 by reading source)

1. **Slugs are neither generated nor unique.** `server/db/migrations/001_init.ts:8` has no unique index and `server/src/services/service.ts:7` accepts any 1-255 character string, so two posts can share `designing-rest-apis`. A slug-based URL would then be ambiguous. Fix: derive the slug in the service, add a unique index, map Postgres error `23505` to 409.
2. **`status` is free text with no visibility rule.** `server/src/services/service.ts:8` accepts any string (the tests post `"active"`), and `server/src/models/model.ts:4` returns drafts to every caller. Fix: `z.enum(["draft","published"])` plus a public list that filters `status = 'published'`.
3. **Search treats `%` and `_` as wildcards.** `server/src/models/model.ts:13` interpolates the raw term into `%...%`. It is parameterized, so not SQL injection, but searching `_` matches every post. Sibling project 06 escapes them (`../../06-bookmark-manager/server/src/models/model.ts:7`). The list is also unbounded: no `limit` anywhere in the model.
4. **Error mapping is lossy.** `server/src/middleware/errorMiddleware.ts:11` turns any non-`AppError` into a 500 (default at `server/src/utils/errors.ts:4`) carrying the raw message, so malformed JSON from `express.json` becomes a 500 and database errors leak their text. The object guard replies with `error: "Send a JSON object."` as a plain string (`server/src/app.ts:24`), not the `{ message, code }` shape the client reads at `client/src/services/api.ts:15`. Fix: honour `error.status` for 4xx, log and genericize 5xx, and use one envelope.

## Debugging scenario

*"I click Create and get `slug: String must contain at least 1 character(s)`."*
The form starts with `slug: ""` (`client/src/App.tsx:15`) and nothing generates one.
The `min(1)` at `server/src/services/service.ts:7` fails, `parsePayload` throws a
`ValidationError` (`server/src/services/service.ts:27`, a 400 per
`server/src/utils/errors.ts:15`), the middleware serializes it, the interceptor
(`client/src/services/api.ts:10`) turns it into an `Error` and `client/src/App.tsx:87`
shows it. Fill the slug field, or build slug generation (rung 4).

## Growth ladder

1. **Goal:** trace one request end to end. **Check:** `grep -n "orWhereILike" server/src/models/model.ts` prints line 13, and you can say why `/stats` must precede `/:id`.
2. **Goal:** run the API tests. **Check (run locally, needs Postgres):** set `ASTRA_TEST_DATABASE_URL` to a database whose name starts with `astra_test_` (enforced at `test/database.ts:13`) and run `npm test` from the project root. Expect the four server tests to pass, including "delete removes the record and repeated operations return 404", then the two client tests in `client/src/App.test.tsx`.
3. **Goal:** escape LIKE metacharacters. **Check:** `grep -n "ESCAPE" server/src/models/model.ts` currently prints nothing; after your change it matches, and a new test proves `search=_` no longer returns every post.
4. **Goal:** unique, generated slugs. **Check:** `grep -rn "unique" server/db/migrations/` currently prints nothing; after a new migration it matches, and a duplicate-slug POST returns 409.
5. **Goal:** draft/published rules plus pagination. **Check:** a test shows a `draft` post is absent from the public list, and `GET /api/posts?limit=2` returns at most 2 rows.

## Review prompts

- Which code belongs in controllers, services and models? (Here the controller does no validation; the service owns all of it.)
- Which validation belongs on the client, and which must be repeated on the server? (The client does none; every rule is in `recordSchema`.)
- How would this schema change when adding authentication or multi-user ownership? (Start with an `author_id` column and a filter in every model query.)
