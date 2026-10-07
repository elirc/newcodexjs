# FABLE Guide — Bookmark Manager

**Project 6: your first TypeScript scaffold-upgrade project.** The theme is
**hardening an API's edges**: schema validation with Zod, API versioning, fetching
metadata from external URLs, and designing an endpoint that outside clients (a
bookmarklet) can call. Projects 1–5 taught you the layers; this one teaches you the
*boundaries* — every place data enters or leaves your process.

Like Project 4, this is a working-but-naive scaffold plus labs. The scaffold runs
today; the learning-focus features are yours to build.

---

## 1. What you get vs. what you build

**You get:** a TypeScript Express + Knex API for `bookmarks` (`title`, `url`,
`collection`, `status`, `tags`) with list/search/stats/CRUD, the standard envelope,
and a one-page React client (`client/src/App.tsx`). The whole server is twelve
small files under `server/src/` — the same generic scaffold as Projects 4 and 7–10
(routes → `controller.ts` → `service.ts` → `model.ts`), plus `services/metadata.ts`.

> **Status check (verified 2026-10-06 against source):** this copy has already done much of
> Labs 1 and 3. `service.ts` parses payloads with a Zod schema (http/https-only URLs without
> credentials, bounded text, capped tags), `model.ts` searches with escaped `ILIKE` on
> `title`/`url`/`collection` instead of `CAST(bookmarks AS TEXT)`, and
> `POST /api/bookmarks/metadata` fetches a page `<title>` for hosts allow-listed in
> `BOOKMARK_METADATA_HOSTS` (timeout, size cap, no redirects, public-IPv4 check). Still open:
> `status` is free text (no enum), no versioning, no bookmarklet endpoint, and the client
> still filters with `JSON.stringify(record)` in `App.tsx`. Read the table as history.

**You build:**

| Upgrade | Replaces this shortcut |
|---|---|
| Zod validation | `service.ts#sanitizePayload` only allow-lists field *names* — a `url` of `"not a url"` or a 10MB `title` sails through. |
| API versioning | Routes mount at `/api/bookmarks` with no version; changing a response shape today breaks every client silently. |
| URL metadata fetch | Creating a bookmark stores whatever title you type; real bookmark apps fetch the page's `<title>`/description/favicon. |
| Bookmarklet endpoint | The API assumes the React client; a bookmarklet is a *hostile-environment* client (other people's pages, CORS, no build step). |

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL + TypeScript.
API on **:4106**, client on :5173.

## 2. Run it (10 minutes)

```bash
createdb bookmark_manager_dev
cd 06-bookmark-manager && cp .env.example .env && cd server   # env.ts loads ../.env
npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 06-bookmark-manager/client && npm install && npm run dev
```

```bash
curl "http://localhost:4106/api/bookmarks?search=docs"
# feed it garbage: the original scaffold accepted this; the current Zod schema returns 400
# with one message per bad field (title, url, collection):
curl -X POST http://localhost:4106/api/bookmarks -H "Content-Type: application/json" \
  -d '{"title":"","url":"definitely not a url","status":"whatever"}'
```

## 3. Scaffold tour (20 minutes)

If you did Project 4's FABLE guide you know this shape; skim for differences (it's the
TypeScript edition). Otherwise read in this order:

1. `server/src/routes/routes.ts` → `controllers/controller.ts` — thin wiring, envelope out.
2. `server/src/services/service.ts` — one dense file: the Zod `schema`, `parseId`,
   `sanitizePayload` (Zod `safeParse`, `.partial()` for updates), get-or-404, delegating CRUD.
   **This file is Lab 1's patient** (now largely healed; find what it still allows).
3. `server/src/models/model.ts` — Knex CRUD + an escaped `ILIKE` search over
   `title`/`url`/`collection` (it replaced the `CAST(bookmarks AS TEXT) ILIKE` shortcut
   critiqued in Project 4's guide).
4. `server/db/migrations/001_init.ts` — check the `url` column length and `tags` type. (A
   `001_init.js` twin also exists, but `npm run migrate` uses `knexfile.ts`, which loads only `.ts`.)
5. `client/src/App.tsx` + `services/api.ts` — one-page client; note the typed fetch layer.

## 4. The labs

### Lab 1 — Zod at the boundary (junior→mid) — the headline lab
Add `zod`, define `createBookmarkSchema` / `updateBookmarkSchema` (valid http/https
`url`, non-empty bounded `title`, enum `status`, `tags` as string array), and have the
service `parse` incoming payloads instead of allow-listing keys.
- Map `ZodError` → your `ValidationError` in one place (error middleware or a helper)
  so clients still get the standard envelope — with **field-level messages**.
- Derive the TS types from the schemas (`z.infer<>`) so validation and types can never
  disagree. That single idea — *schema as the source of truth* — is the take-away.
**Prove it:** the garbage `curl` from §2 now returns a 400 naming each bad field.

### Lab 2 — API versioning (mid)
Mount the current router at `/api/v1/bookmarks` (keep `/api/bookmarks` as an alias for
now), then introduce a deliberate breaking change in a `v2` router — e.g., rename
`collection` to `folder` in responses — sharing service/model code between versions.
Write 10 lines on: what qualifies as breaking, how long v1 lives, and how a client
discovers deprecation (headers? docs?). Versioning is 20% routing and 80% policy.

### Lab 3 — URL metadata fetch (mid)
`POST /api/bookmarks/preview` takes `{url}`, server-side fetches the page, extracts
`<title>` / meta description / favicon, returns them for the form to prefill.
This is your first **outbound** call, so the engineering is in the failure modes:
timeouts (abort at ~5s), non-HTML responses, redirect limits, and size caps.
**Senior seasoning:** your server now fetches arbitrary user-supplied URLs — that's
SSRF territory. Reject private/internal addresses (localhost, 10.x, 169.254.x) and
write two sentences on why a naive allow/deny check on the *hostname* isn't enough.

### Lab 4 — Bookmarklet-friendly endpoint (mid→senior)
A bookmarklet (`javascript:` snippet in the browser bar) posts the current page's URL
and title to your API *from whatever site the user is on*. Make that work:
CORS policy for arbitrary origins on exactly one route, a lightweight auth token in
the query or header, and a tiny confirmation response. Then the design memo: why you
scoped CORS loosening to one endpoint instead of `app.use(cors())` for everything.

## 5. Questions you should be able to answer afterward

- What can Zod's `parse` guarantee that TypeScript types alone cannot, and why does that distinction exist at runtime boundaries?
- Where should Zod schemas live so both validation and types derive from them — and should the *client* import them too?
- What makes a change "breaking" for an API consumer? Give one example each of breaking and non-breaking from your v2.
- What is SSRF and why did the metadata fetch create the risk?
- Why is `Access-Control-Allow-Origin: *` incompatible with cookie auth, and how does that shape the bookmarklet's auth design?

## 6. Common traps

- **Validating too late:** if Zod runs in the controller but the service is also called from elsewhere (tests, other services), the service is unprotected. Put the parse where every path crosses it.
- **`z.string().url()`** accepts `javascript:alert(1)` — constrain protocols explicitly.
- **Versioning by copy-paste:** duplicating the whole stack per version rots instantly; share the service and translate at the controller edge.
- **Fetch without a timeout:** one hung external site consumes a connection forever. `AbortController` is not optional.

Next: Project 7 (`07-blog-platform`) — the sanitization boundary gets real: storing and
rendering user-authored rich text safely.
