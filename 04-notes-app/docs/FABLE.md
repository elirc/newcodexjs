# FABLE Guide — Notes App

**Project 4: a deliberately small scaffold you upgrade yourself.** Projects 1–3 gave
you finished apps to read. This one flips the model: you get a *working but naive*
CRUD app, and the learning is in replacing its shortcuts with the real patterns —
markdown rendering, folders/tags, debounced autosave, and PostgreSQL full-text search.

Building on a scaffold is closer to real jobs than greenfield work: you inherit code,
find its weakest seam, and improve it without breaking what works.

---

## 1. What you get vs. what you build

**You get (working today):** an Express + Knex + Postgres API for `notes`
(list/get/create/update/delete/stats) with the standard envelope, and a single-page
React client (`client/src/App.jsx`) with a form, list, search box, and stats strip.
Notes already have `title`, `body`, `folder`, `status`, and `tags` fields.

**You build (the labs in §5):**

| Upgrade | Replaces this shortcut in the scaffold |
|---|---|
| Markdown rendering | `body` is displayed as plain text even though seeds contain markdown (`"# Draft"`). |
| Real search (Postgres FTS) | `model.js` searches with `CAST(notes AS TEXT) ILIKE '%term%'` — the whole row cast to text. Read that line and enumerate why it's wrong. |
| Debounced autosave | The form saves only on explicit submit. |
| Folder/tag navigation | `folder` and `tags` are stored but the UI filters by a client-side `JSON.stringify(record).includes(search)` — yes, really (see `App.jsx`). |

The gap between the scaffold and the target *is the curriculum.* The naive lines are
left visible on purpose so you can articulate what's wrong before fixing it.

**Stack:** React 18 + Vite / Express + Knex + PostgreSQL / JavaScript.
Same layer rules as always: routes → controller → service → model.

---

## 2. Run it (10 minutes)

```bash
createdb notes_app_dev
cd 04-notes-app/server && cp .env.example .env
npm install && npm run migrate && npm run seed && npm run dev   # API on :4104
# another terminal
cd 04-notes-app/client && npm install && npm run dev            # UI on :5173
```

```bash
curl "http://localhost:4104/api/notes?search=markdown"
curl "http://localhost:4104/api/notes/stats"
```

---

## 3. Guided code tour (30 minutes — it's small on purpose)

| # | File | Notice this |
|---|------|-------------|
| 1 | `server/src/routes/routes.js` → `controllers/controller.js` | Generic names (`controller.js`, not `noteController.js`) — this scaffold shape is shared by Projects 4 and 6–10. Once you've read one, you can navigate all of them. |
| 2 | `server/src/services/service.js` | `parseId`, `sanitizePayload` with an allow-list of fields. Compact but the same responsibilities as Project 1's fat service. What validation is *missing* compared to Project 1? (Length limits, enum checks…) List them; they're Level 1 work. |
| 3 | `server/src/models/model.js` | 15 lines, and line 4 is the star: `CAST(notes AS TEXT) ILIKE`. It matches ids, timestamps, and status values, not just text. It also can't use any index. |
| 4 | `server/db/migrations/001_init.js` | The schema. Check how `tags` is stored (array/jsonb/text?) — your tag-filter lab depends on it. |
| 5 | `client/src/App.jsx` | Everything in one component: state, fetch, form, list. Fine at this size — but find the line `records.filter((record) => JSON.stringify(record)...)` and note it searches *client-side* over *already-fetched* rows while the server also supports `?search=`. Two search implementations, both weak. Decide which one should win. |
| 6 | `client/src/services/api.js` | The only fetch layer. Same isolation rule as Project 1's `tasksApi.js`. |

---

## 4. The labs (this replaces the generic challenge ladder)

Do them in order; each has a "prove it" step.

### Lab 1 — Honest server search (junior)
Replace the `CAST(notes AS TEXT)` search with explicit `ILIKE` on `title` and `body`
only, and make the client search box call the API (debounced — reuse the pattern from
`02-contact-book/client/src/features/contacts/useDebounce.js`) instead of filtering
client-side. Delete the `JSON.stringify` filter.
**Prove it:** searching `active` no longer matches every note whose *status* is active.

### Lab 2 — Markdown rendering (junior)
Render `body` as markdown in a preview pane (`react-markdown` is the standard choice).
**The real lesson is the security question:** markdown → HTML is an injection boundary.
Write a note whose body is `<img src=x onerror=alert(1)>` and confirm your renderer
neutralizes it. Know *why* (react-markdown doesn't pass raw HTML by default) before
you rely on it. This boundary returns with real stakes in Project 7's rich-text editor.

### Lab 3 — Folders and tags as first-class navigation (junior→mid)
Sidebar of folders (distinct values), clickable tag pills, server-side `?folder=` and
`?tag=` params. How you filter by tag depends on the column type you found in the
migration — `whereRaw` on jsonb containment vs. array `any()`. Show the SQL in your PR
description.
**Prove it:** filters combine (folder + tag + search) without breaking each other.

### Lab 4 — Debounced autosave (mid)
Editing a note saves ~1s after the user stops typing: dirty-state tracking, a debounce,
`PUT` on idle, and a "Saved / Saving…" indicator. Handle the two classic bugs:
- **Out-of-order responses:** slow save A resolves after fast save B — guard with a
  request counter or abort the stale one.
- **Save-on-unmount:** the user closes the editor 300ms after typing. Flush or drop?
  Decide and comment why.
**Prove it:** throttle the network in devtools and hammer the keyboard; the final DB
state matches the final screen state.

### Lab 5 — PostgreSQL full-text search (mid→senior)
Replace Lab 1's `ILIKE` with real FTS:
1. Migration: add a generated `tsvector` column over `title` (weight A) and `body`
   (weight B), plus a GIN index.
2. Model: `WHERE search_vector @@ websearch_to_tsquery(?)` with `ts_rank` ordering.
3. Compare plans: `EXPLAIN ANALYZE` for `ILIKE '%term%'` vs. the FTS query.
**Senior extension (1 page):** what FTS *doesn't* give you (typo tolerance, cross-field
relevance tuning) and at what point you'd reach for a dedicated search engine —
including the operational cost of running one and keeping it in sync.

---

## 5. Questions you should be able to answer afterward

- Why can't `ILIKE '%term%'` use a B-tree index, and what index type does FTS use?
- What's the difference between escaping, sanitizing, and rejecting input — and which does markdown rendering need?
- In autosave, what exact user action should create a *new* note vs. update the existing one?
- Where did you put the debounce — component, hook, or API layer — and why?
- What does `websearch_to_tsquery` do with the input `"exact phrase" -excluded` that ILIKE never could?

## 6. Common traps

- **Autosave + validation:** an autosaving form can't block on "title required" the way a submit button can. Decide the contract (save drafts with empty titles? placeholder title?) before coding.
- **jsonb vs. text tags:** `where("tags", "like", ...)` on a jsonb column fails or lies. Check the column type first.
- **FTS stemming surprises:** searching `running` matches `run`. That's a feature — but your tests must expect it.
- **The scaffold's generic filenames** (`service.js`, `model.js`) mean global search for "service" hits every project. Search within the project folder.

Next: Project 5 (`05-recipe-manager`) — the jump to TypeScript, JWT auth, and
transactions. It's the biggest single step in the curriculum; budget real time for it.
