# Notes App Architecture

All claims below were verified 2026-10-06 by reading source. Paths are relative to the project root (`04-notes-app/`).

## Folder Structure

- `client/`: Vite + React 18 UI, one component (`client/src/App.jsx`) styled with CSS Modules; all HTTP goes through `client/src/services/api.js` (axios).
- `server/`: Express 4 API (CommonJS) with route → controller → service → model layers under `server/src/`.
- `server/db/migrations/`: two reversible migrations — `001_init.js` (the `notes` table) and `002_search_index.js` (a GIN full-text index).
- `server/db/seeds/`: three sample notes in `001_seed.js` (see Senior finding 1 before relying on it).
- `server/test/`: one `node:test` file, `search.test.cjs` (4 tests), plus the `database.cjs` harness that creates a throwaway schema in an `astra_test_*` database.

## Request Flow

A request enters the router mounted at `/api/notes` (`server/src/app.js:14`). Every handler is wrapped so a rejected promise reaches Express's error pipeline (`server/src/routes/routes.js:4`). The controller only extracts `req.query` / `req.params.id` / `req.body`; the service validates and applies rules; the model runs Knex; the controller returns `{ success: true, data }` via `sendSuccess` (`server/src/utils/response.js:2`). Errors become `{ success: false, error: { message, code } }` in `server/src/middleware/errorMiddleware.js:4`.

Routes (`server/src/routes/routes.js:5-10`): `GET /`, `GET /stats`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`. `/stats` is declared before `/:id`, so "stats" is never parsed as an id. There is also `GET /health` outside the router (`server/src/app.js:13`).

## Request trace: creating a note

1. **UI** — the form's submit handler `saveRecord` (`client/src/App.jsx:53`) calls `createRecord(form)` when no note is being edited. `tags` were already split on commas by `updateField` (`client/src/App.jsx:48`).
2. **API client** — `createRecord` (`client/src/services/api.js:24`) POSTs to `${VITE_API_URL || "http://localhost:4104/api"}/notes` and `unwrap` (`client/src/services/api.js:9`) returns `response.data.data`.
3. **App middleware** — `helmet`, `cors`, `morgan`, then `express.json()` (`server/src/app.js:12`) parses the body.
4. **Route** — `router.post("/", wrap(controller.create))` (`server/src/routes/routes.js:8`).
5. **Controller** — `create` (`server/src/controllers/controller.js:8`) passes `req.body` to the service and replies 201.
6. **Service** — `create` (`server/src/services/service.js:39`) runs `sanitizePayload` (`server/src/services/service.js:8`): allow-lists `title`, `folder`, `status`, `body`; requires non-blank strings ≤255 chars (body may be empty, ≤100,000 chars); trims; defaults tags to `[]`, caps them at 30 entries of ≤50 chars, and de-duplicates with a `Set`.
7. **Model** — `createRecord` (`server/src/models/model.js:18`) inserts via `databasePayload` (`server/src/models/model.js:12`), which `JSON.stringify`s `tags` because the column is `jsonb`, and returns the row with `.returning("*")`.
8. **Schema** — the row lands in `notes` (`server/db/migrations/001_init.js:2`).

The client then resets the form and calls `refresh()`, which re-fetches the list and stats in parallel (`client/src/App.jsx:32`).

## Auth: there is none

`grep -rniE "jwt|token|cookie|auth|session" server/src client/src server/package.json client/package.json` returns exactly one line: `rejectUnauthorized` in the DB SSL option (`server/src/config/env.js:16`). There are no users, no login, and no ownership column. The only cross-origin control is `cors({ origin: env.clientOrigin, credentials: true })` (`server/src/app.js:10`), which stops *browsers* on other origins from reading responses — it does not stop `curl` or any script. Anyone who can reach port 4104 can read, edit or delete every note. (`server/test/database.cjs:18` sets `JWT_*`/`COOKIE_SECRET` env vars, but nothing in `server/src` reads them; the harness is shared with projects that do have auth.)

## Data model

`notes` — `server/db/migrations/001_init.js:2-10`

| Column | Type | Constraints |
|---|---|---|
| `id` | `increments` (serial int4) | primary key |
| `title` | varchar(255) | NOT NULL |
| `body` | text | nullable |
| `folder` | varchar(255) | NOT NULL |
| `status` | varchar(255) | NOT NULL, free text (no enum or CHECK) |
| `tags` | jsonb | NOT NULL, default `'[]'` |
| `created_at`, `updated_at` | `timestamps(true, true)` | NOT NULL, default now() |

`updated_at` is set by the application on update (`server/src/models/model.js:20`), not by a trigger.

Index — `server/db/migrations/002_search_index.js:4`: `notes_search_idx`, a GIN expression index on `to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,''))`. The search predicate in `server/src/models/model.js:9` uses the identical expression with `plainto_tsquery('english', ?)`, which is what lets the planner use the index. Filters (`status`, `folder`, `search`) are ANDed, and results are ordered `created_at DESC, id DESC` (`server/src/models/model.js:5`).

## Senior findings (verified 2026-10-06 by reading source)

1. **The seed inserts raw JS arrays into a jsonb column** — `server/db/seeds/001_seed.js:9`. The model stringifies tags (`server/src/models/model.js:13`) because node-postgres serialises a JS array as a Postgres array literal (`{"markdown","reference"}`), which is not valid JSON; the seed skips that step. Expect `npm --prefix server run seed` to fail with an invalid-json error. *Fix:* map each row to `{ ...row, tags: JSON.stringify(row.tags) }`, as `06-bookmark-manager/server/db/seeds/001_seed.ts` does.
2. **Malformed JSON bodies return 500, not 400** — `server/src/middleware/errorMiddleware.js:4`. Any error that is not an `AppError` is rewrapped with status 500, so `express.json()`'s parse error (which carries `status: 400`) is reported as a server fault and its parser message is echoed to the client. The same path echoes raw Postgres error text. *Fix:* honour `error.status`/`error.type === "entity.parse.failed"` as 400, and return a generic message for unknown 500s while logging the original.
3. **Unbounded list, fetched on every keystroke** — `server/src/models/model.js:5` has no `limit`/`offset`, and the client re-requests the full list plus stats 250 ms after each change to the search box (`client/src/App.jsx:43`). Fine for 3 rows; linear payload growth for 30,000. *Fix:* add `limit`/cursor params validated in the service, and fetch stats only after writes.
4. **Nothing guards the index/predicate pairing** — the test file only runs `001_init` (`server/test/search.test.cjs:7`), so test schemas never contain `notes_search_idx`. If someone edits the expression in `server/src/models/model.js:9` (say, adding `folder`), every test still passes while production silently falls back to a sequential scan. *Fix:* run both migrations in the harness and add an `EXPLAIN` assertion, or move to a generated `tsvector` column so the expression lives in one place.

## Debugging scenario: "searching 'the' empties the list"

- **Symptom:** typing `the` or `and` shows "0 matching notes" even though many notes contain the word.
- **Where to look:** the predicate at `server/src/models/model.js:9`.
- **Root cause:** `plainto_tsquery('english', 'the')` drops English stop words and yields an empty query (Postgres emits a NOTICE), and `@@` against an empty query matches nothing. This is full-text semantics, not a bug in the filter chain — the service passed a valid trimmed string (`server/src/services/service.js:30`).
- **Fix:** decide the contract. Either skip the predicate when `numnode(plainto_tsquery(...)) = 0`, or tell the user stop words are ignored. Add a test next to the existing stemming test.

## Design Decisions

- One domain workflow (notes) so the four layers are easy to trace end to end.
- Migration + seed so SQL behaviour can be studied before the UI (but see finding 1).
- Validation lives only in the service; the client sends whatever the form holds.
- The client guards stale search responses with a request counter (`client/src/App.jsx:27`) so a slow early search cannot overwrite a later one.

## Growth ladder

1. **Goal:** name every endpoint and its handler. **Check:** `grep -c "router\.\(get\|post\|put\|delete\)" server/src/routes/routes.js` prints `6`.
2. **Goal:** list every server-side validation rule from memory. **Check:** `grep -c "ValidationError(" server/src/services/service.js` prints `6`; explain each without looking.
3. **Goal:** run the test suite. **Check (run locally, needs Postgres):** with `ASTRA_TEST_DATABASE_URL` pointing at an `astra_test_*` database, `npm --prefix server test` reports 4 passing tests.
4. **Goal:** fix finding 1. **Check:** `grep -n "JSON.stringify" server/db/seeds/001_seed.js` returns a line (today it returns nothing), and `npm --prefix server run seed` succeeds (run locally, needs Postgres).
5. **Goal:** prove the index is used. **Check (run locally, needs Postgres):** after both migrations, `SET enable_seqscan = off; EXPLAIN SELECT * FROM notes WHERE to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, '')) @@ plainto_tsquery('english', 'markdown');` shows a Bitmap Index Scan on `notes_search_idx`.

## Review Prompts

- Which code belongs in controllers, services, and models?
- Which validation belongs on the client, and which must be repeated on the server?
- How would this schema change when adding authentication or multi-user ownership?
