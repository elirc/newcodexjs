# Architecture

The app follows the Tier 1 conventions: React 18 + Vite frontend, Express API, PostgreSQL, Knex models, thin controllers, service-layer business logic, centralized errors, and a standard `{ success, data }` envelope (`server/src/utils/responses.js:8`). Every claim below was verified 2026-10-06 by reading source; citations are `path:line` from the project root.

## Backend

- `server/src/routes` maps URLs to controllers; every handler is wrapped in `asyncHandler` (`server/src/middleware/errors.js:40`) so rejected promises reach the error middleware. `/export` is declared before `/:id` (`server/src/routes/contactRoutes.js:8`).
- `server/src/controllers` converts `req.params.id` to a number and returns the envelope — no business rules.
- `server/src/services` validates and coordinates contact/tag workflows. `parseContactPayload` (`server/src/services/contactService.js:10`) enforces per-field length limits, required names, and an email regex.
- `server/src/models` contains only Knex queries: the shared filter builder (`server/src/models/contactModel.js:25`), pagination with a separate `countDistinct` query (`server/src/models/contactModel.js:50`), and a single `whereIn` tag lookup for a page of contacts (`server/src/models/contactModel.js:144`) — no N+1 on the list path.
- `server/src/middleware/errors.js` (not `errorHandler.js`) defines `AppError`, `NotFoundError`, `ValidationError`, and `errorHandler` (`server/src/middleware/errors.js:52`), which returns `{ success: false, error: { message, code } }` and replaces any 5xx message with "Something went wrong".
- The single migration is reversible (`down` drops tables in dependency order). The seed creates 50 contacts (`server/db/seeds/001_contacts.js:26`), 8 tags (`server/db/seeds/001_contacts.js:11`), and 99 contact-tag rows: each contact gets `(index % 3) + 1` tags (`server/db/seeds/001_contacts.js:43`), i.e. 17×1 + 17×2 + 16×3.

## Frontend

All UI state and components (`TagPill`, `ContactForm`, `ContactTable`) live in `client/src/App.jsx`; `client/src/features/contacts` holds only the `useDebounce` hook (`client/src/features/contacts/useDebounce.js:9`), used with a 300ms delay. API calls go through axios helpers in `client/src/services/api.js`. Styling uses CSS Modules (`App.module.css`, `components/ui/Button.module.css`). Export downloads a Blob via `URL.createObjectURL`; import sends text pasted into an input — no file picker or Blob is involved. `react-router-dom` is a dependency but is not imported anywhere in `client/src`.

## Tradeoff

The import endpoint accepts CSV as raw `text/csv` (`server/src/app.js:16`) or `{ csv }` JSON instead of multipart form data, which keeps Project 2 free of `multer`. The parser caps a batch at 1000 rows (`server/src/utils/csv.js:68`).

## Request trace: create contact

1. `contactApi.create` posts the form (`client/src/services/api.js:20`), called from `saveContact` (`client/src/App.jsx:154`).
2. `POST /api/contacts` is mounted at `server/src/app.js:19` and routed at `server/src/routes/contactRoutes.js:10`.
3. `create` passes `req.body` through and answers 201 (`server/src/controllers/contactController.js:21`).
4. `createContact` parses the payload, inserts, replaces tags, then re-reads with tags (`server/src/services/contactService.js:67`).
5. Model: `createContact` inserts with `returning("*")` (`server/src/models/contactModel.js:87`); `replaceContactTags` deletes and re-inserts junction rows in its own transaction (`server/src/models/contactModel.js:130`).
6. Schema: `contacts` (`server/db/migrations/202607030201_create_contacts_tags.js:7`).

CSV import follows the same shape: `contactApi.importCsv` (`client/src/services/api.js:24`) → `server/src/routes/contactRoutes.js:12` → `importCsv` (`server/src/controllers/contactController.js:49`) → `importContacts`, which validates every row before any write (`server/src/services/contactService.js:124`) → `importContactBatch`, one transaction for contacts, tags, and junction rows (`server/src/models/contactModel.js:160`).

## Auth

There is none. A grep of `server/src`, `server/db`, and `client/src` for `jwt|token|cookie|auth|session` returns no hits; there is no users table and no auth middleware. The only access control is CORS restricted to `CLIENT_ORIGIN` (`server/src/app.js:13`, default `http://localhost:5172` at `server/src/config/env.js:21`). CORS only limits browsers: any `curl` caller can `POST /api/contacts/bulk-delete` (`server/src/routes/contactRoutes.js:11`) or export every contact. The test harness sets `JWT_*` and `COOKIE_SECRET` variables (`server/test/database.cjs:18`), but nothing reads them.

## Data model

From `server/db/migrations/202607030201_create_contacts_tags.js`:

| Table | Column | Type / constraint |
|---|---|---|
| contacts | id | serial PK |
| contacts | first_name, last_name | varchar(100) NOT NULL |
| contacts | email | varchar(255) UNIQUE, nullable (`:11`) |
| contacts | phone / company / street_address / city / state / zip_code / country | varchar 30 / 255 / 255 / 100 / 100 / 20 / 100 |
| contacts | notes | text |
| contacts | created_at, updated_at | timestamptz NOT NULL default now() (`timestamps(true, true)`) |
| tags | id, name, color, created_at | serial PK; varchar(50) NOT NULL UNIQUE; varchar(7) NOT NULL default `#6366f1`; timestamp default now() (`server/db/migrations/202607030201_create_contacts_tags.js:23`) |
| contact_tags | contact_id, tag_id | integer FKs → contacts.id / tags.id, both `ON DELETE CASCADE`; composite PK (contact_id, tag_id) (`server/db/migrations/202607030201_create_contacts_tags.js:30`) |

Indexes: only the PKs and the two UNIQUE constraints. Nothing supports the `ILIKE '%term%'` search (`server/src/models/contactModel.js:30`).

## Senior findings (verified 2026-10-06 by reading source)

1. **Create is not atomic.** `createContact` (`server/src/services/contactService.js:67`) inserts the contact, then calls `replaceContactTags` in a separate transaction. A `tagIds` value that passes the positive-integer check but names a missing tag raises an FK violation after the contact row is committed: the client gets a 500 and an orphan, untagged contact remains. Fix: run insert + junction writes inside one `db.transaction` and pass `trx` into both model calls; check tag ids exist first and return 400.
2. **Constraint violations become opaque 500s.** Only import maps `23505` (`server/src/services/contactService.js:139`). A duplicate email on create/update, a duplicate tag name, or a color longer than 7 characters (`parseTag` does no validation, `server/src/services/tagService.js:17`) all reach `errorHandler` as "Something went wrong". Fix: add a `ConflictError` (409) and translate `23505`/`23503`/`22001` in one helper.
3. **Out-of-order list responses.** The list effect (`client/src/App.jsx:139`) never cancels or ignores stale requests, so a slow response for an older search can overwrite a newer one. Fix: an `ignore` flag in the effect cleanup or an `AbortController` passed to axios.
4. **Chatty import transaction.** `importContactBatch` (`server/src/models/contactModel.js:160`) issues one insert per contact plus three queries per tag, so a 1000-row file with two tags each runs about 7000 statements while holding one transaction. Fix: bulk-insert contacts, upsert all distinct tag names once, then bulk-insert junction rows.

## Debugging scenario

**Symptom:** pasting a CSV from another tool (with an extra `website` column) does nothing; DevTools shows `POST /api/contacts/import` → 400 "CSV has duplicate or unsupported headers".
**Where to look:** `server/src/utils/csv.js:66` rejects any header not in the exact snake_case `HEADERS` list (`server/src/utils/csv.js:2`); a `First Name` header fails even earlier, at the required-columns check (`server/src/utils/csv.js:64`). The UI stays silent because the import button's promise has no `.catch` (`client/src/App.jsx:192`).
**Root cause:** a strict whitelist plus a client that swallows rejections.
**Fix:** decide the contract (ignore unknown columns and report them, or keep rejecting), and render `error.response.data.error.message` in the UI.

## Growth ladder

1. **Goal:** Explain why route order matters. **Check:** `grep -n "router\." server/src/routes/contactRoutes.js` prints 8 routes, with `/export` on line 8 before `/:id` on line 9.
2. **Goal:** Know the error contract. **Check:** `grep -rn "23505" server/src` returns exactly one hit, `server/src/services/contactService.js:139`; after finding 2 is fixed, create/update paths also translate it.
3. **Goal:** Use transactions deliberately. **Check:** `grep -n "db.transaction" server/src/models/contactModel.js` returns 2 hits (lines 131, 161) today; after fixing finding 1, `createContact` runs inside one transaction.
4. **Goal:** Run and extend the tests. **Check:** `grep -c "^test(" server/test/import.test.cjs` → 5. Run locally (needs Postgres): `ASTRA_TEST_DATABASE_URL=postgres://…/astra_test_contacts npm test` in `server/` → 5 passing, including "a late database uniqueness failure rolls back contacts, new tags and junctions" (`server/test/import.test.cjs:49`).
5. **Goal:** Make the client resilient. **Check:** `grep -n "catch" client/src/App.jsx` returns nothing today; a mid-level version shows server error messages and cancels stale list requests.
