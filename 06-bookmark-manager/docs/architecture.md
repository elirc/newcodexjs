# Bookmark Manager Architecture

All claims below were verified 2026-10-06 by reading source. Paths are relative to the project root (`06-bookmark-manager/`).

## Folder Structure

- `client/`: Vite + React 18 + TypeScript UI, one component (`client/src/App.tsx`) styled with CSS Modules; HTTP goes through `client/src/services/api.ts` (axios).
- `server/`: Express 4 API in TypeScript (ESM, run with `tsx`) with route → controller → service → model layers, plus `server/src/services/metadata.ts` for outbound page-title fetches.
- `server/db/migrations/` and `server/db/seeds/`: each holds **both** a `.ts` and a `.js` file (see below).
- `server/test/`: `bookmarks.test.ts` (2 tests, needs Postgres), `metadata.test.ts` (3 tests, local HTTP server only), and the `database.cjs` harness.

### Which knexfile / migration actually runs?

`npm run migrate` and `npm run seed` invoke the Knex CLI with `--knexfile knexfile.ts` (`server/package.json:9-10`). That config sets `loadExtensions: [".ts"]` (`server/knexfile.ts:8-9`), so Knex loads only `001_init.ts` and `001_seed.ts`. Nothing references `knexfile.js`, `001_init.js` or `001_seed.js` except the test, which imports `../db/migrations/001_init.js` (`server/test/bookmarks.test.ts:10`); under `tsx` that specifier may resolve to either file, and both define the identical table. The `.js` files look like stale compiler output: `knexfile.js` imports `./src/config/env` without an extension (`server/knexfile.js:1`), which native ESM would reject, and `001_seed.js` inserts tags without `JSON.stringify` (`server/db/seeds/001_seed.js:9`), unlike the `.ts` seed (`server/db/seeds/001_seed.ts:34`). Without `loadExtensions`, Knex would see two migrations both named `001_init` and the second `createTable` would fail.

## Request Flow

The router is mounted at `/api/bookmarks` (`server/src/app.ts:15`), every handler is wrapped so rejections reach the error middleware (`server/src/routes/routes.ts:5`), the controller extracts query/params/body, the service validates with Zod, the model runs Knex, and `sendSuccess` (`server/src/utils/response.ts:4`) returns `{ success: true, data }`. Errors become `{ success: false, error: { message, code } }` (`server/src/middleware/errorMiddleware.ts:5`).

Routes (`server/src/routes/routes.ts:6-12`): `GET /`, `GET /stats`, `POST /metadata`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`. `GET /health` lives outside the router (`server/src/app.ts:14`).

## Request trace: creating a bookmark (with optional title fetch)

**Optional preview step** (never writes):

1. "Use page title" calls `usePageTitle` (`client/src/App.tsx:68`), which calls `previewMetadata` (`client/src/services/api.ts:49`) → `POST /api/bookmarks/metadata` (`server/src/routes/routes.ts:8`).
2. Controller `metadata` (`server/src/controllers/controller.ts:19`) → service `metadata` (`server/src/services/service.ts:40`) → `fetchMetadata` (`server/src/services/metadata.ts:63`).
3. `fetchMetadata` refuses anything except HTTPS on port 443 to a hostname listed in `BOOKMARK_METADATA_HOSTS` (`server/src/services/metadata.ts:65-66`), resolves IPv4 only, rejects the request if *any* resolved address fails `isPublicIPv4` (`server/src/services/metadata.ts:15`), then connects through `createHtmlTransfer` (`server/src/services/metadata.ts:35`), which pins the socket to the checked address via a custom `lookup`, follows no redirects, requires `text/html` and uncompressed bodies, and caps the body at 64 KiB. The whole operation races a 5 s timeout. The `<title>` is extracted by regex, five named entities decoded, and truncated to 255 chars. The client only applies the result if the URL field hasn't changed meanwhile (`client/src/App.tsx:73`).

**Create step:**

1. `saveRecord` (`client/src/App.tsx:52`) → `createRecord` (`client/src/services/api.ts:26`) → `POST /api/bookmarks`.
2. Route `router.post("/", ...)` (`server/src/routes/routes.ts:10`) → controller `create` (`server/src/controllers/controller.ts:10`), 201 on success.
3. Service `create` (`server/src/services/service.ts:36`) → `sanitizePayload` (`server/src/services/service.ts:21`), which parses with the Zod `schema` (`server/src/services/service.ts:6`): trimmed 1–255-char `title`/`collection`/`status`; `url` normalised by `bookmarkUrl` (`server/src/services/metadata.ts:6`: http/https only, no credentials, ≤255 chars); `tags` ≤30 strings of ≤50 chars, default `[]`, then de-duplicated. Updates use `schema.partial()`, so omitted fields are left alone.
4. Model `createRecord` (`server/src/models/model.ts:19`) stringifies tags and inserts with `.returning("*")` into `bookmarks` (`server/db/migrations/001_init.ts:4`).

Saving a bookmark never fetches its URL; only the explicit preview does.

## Auth: there is none

`grep -rniE "jwt|token|cookie|auth|session" server/src client/src server/package.json client/package.json` returns one line, `rejectUnauthorized` in the DB SSL option (`server/src/config/env.ts:16`). No users, no ownership, no API keys. The only cross-origin control is `cors({ origin: env.clientOrigin, credentials: true })` (`server/src/app.ts:11`), which limits which *browser* origins can read responses but does not authenticate anyone. Consequence: anyone who can reach port 4106 can CRUD every bookmark and make the server fetch allow-listed hosts. The `JWT_*` variables set in `server/test/database.cjs:18` are unused here.

## Data model

`bookmarks` — `server/db/migrations/001_init.ts:4-12`

| Column | Type | Constraints |
|---|---|---|
| `id` | `increments` (serial int4) | primary key |
| `title` | varchar(255) | NOT NULL |
| `url` | varchar(255) | NOT NULL, no UNIQUE |
| `collection` | varchar(255) | NOT NULL |
| `status` | varchar(255) | NOT NULL, free text |
| `tags` | jsonb | NOT NULL, default `'[]'` |
| `created_at`, `updated_at` | `timestamps(true, true)` | NOT NULL, default now() |

No secondary indexes. Search is `ILIKE` across `title`, `url`, `collection` with `%`, `_`, `\` escaped (`server/src/models/model.ts:7-9`), so it always scans; order is `created_at DESC` only, with no id tie-break (`server/src/models/model.ts:4`).

## Senior findings (verified 2026-10-06 by reading source)

1. **The UI ignores server search and re-implements the flaw the server fixed** — `client/src/App.tsx:27` filters with `JSON.stringify(record).includes(search)`, and `refresh` calls `listRecords()` with no params (`client/src/App.tsx:33`). Typing a bookmark's id, a year, or `"status"` matches rows, exactly what `server/test/bookmarks.test.ts:68` asserts the server will not do. *Fix:* pass `{ search }` to `listRecords` (debounced, with a stale-response guard like 04's) and delete the client filter.
2. **Malformed JSON → 500** — `server/src/middleware/errorMiddleware.ts:5` wraps every non-`AppError` as 500, so `express.json()`'s 400 parse error (and raw Postgres messages) surface as server faults with internal text. *Fix:* map `error.status` 4xx through; return a generic 500 message and log the original.
3. **Free-text status + no duplicate guard** — `status: text` (`server/src/services/service.ts:13`) accepts any string, so `stats().byStatus` (`server/src/models/model.ts:25`) fragments on `Active` vs `active`; `url` has no UNIQUE constraint, so the same link can be saved repeatedly. *Fix:* `z.enum([...])` plus a CHECK; a unique index on `url` (or `lower(url)`) and a 409 mapping.
4. **Unbounded list** — `server/src/models/model.ts:4` has no limit, and the client loads everything once and filters in memory. *Fix:* `limit`/cursor params validated in `service.list`.

The metadata fetcher itself is careful (allow-list, DNS pinning, no redirects, timeout, byte cap); its remaining limits are IPv4-only and that numeric entities like `&#39;` are not decoded (`server/src/services/metadata.ts:81`).

## Debugging scenario: "Use page title" always fails

- **Symptom:** clicking it shows "Metadata is enabled only for explicitly configured HTTPS hostnames on port 443…".
- **Where to look:** the allow-list read at `server/src/services/metadata.ts:65`; the shipped value is empty (`.env.example:12`).
- **Root cause:** an empty `BOOKMARK_METADATA_HOSTS` disables fetching by design. Two more traps: `dotenv` loads `../.env` relative to the working directory (`server/src/config/env.ts:3`), so the file must sit at the project root and the server must be started from `server/`; and the default form URL `https://example.com` must match the list exactly (lower-cased hostname, no `www.` folding).
- **Fix:** set `BOOKMARK_METADATA_HOSTS=example.com` in the root `.env` and restart the dev server.

## Design Decisions

- One domain workflow so the layers stay inspectable; Zod in the service so every caller (HTTP or test) is validated.
- Outbound fetching is opt-in and separate from saving, so a slow or hostile site cannot block or corrupt a write.
- Network tests substitute only the connection factory (`server/test/metadata.test.ts:59`), so production response handling is what gets tested.

## Growth ladder

1. **Goal:** map routes to handlers. **Check:** `grep -c "router\.\(get\|post\|put\|delete\)" server/src/routes/routes.ts` prints `7`.
2. **Goal:** explain which migration files Knex loads and why. **Check:** `grep -n "loadExtensions" server/knexfile.ts` shows lines 8 and 9; `grep -rn "knexfile.js" server --include=*.json` prints nothing.
3. **Goal:** run the metadata tests without the internet. **Check (run locally):** without `ASTRA_TEST_DATABASE_URL`, `npm --prefix server test` passes the 3 tests in `metadata.test.ts` while `bookmarks.test.ts` fails at load because `helper.configure()` throws (`server/test/database.cjs:6`); with an `astra_test_*` Postgres database, all 5 pass.
4. **Goal:** fix finding 1. **Check:** `grep -n "JSON.stringify" client/src/App.tsx` returns nothing (today it returns line 27), and `grep -n "listRecords(" client/src/App.tsx` shows a `search` argument.
5. **Goal:** own the SSRF policy. **Check:** the address list starting at `server/test/metadata.test.ts:11` has 14 rejected entries today; add `192.88.99.1` and `240.0.0.1`, predict which branch of `isPublicIPv4` (`server/src/services/metadata.ts:18-22`) rejects each, and confirm with the 3 metadata tests still passing (run locally, no DB needed).

## Review Prompts

- Which code belongs in controllers, services, and models?
- Which validation belongs on the client, and which must be repeated on the server?
- How would this schema change when adding authentication or multi-user ownership?
