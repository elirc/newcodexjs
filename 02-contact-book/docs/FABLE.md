# FABLE Guide — Contact Book / Address Manager

**Project 2: the same layered skeleton as Project 1, plus the four patterns you will
use in every data-heavy app: pagination, debounced search, many-to-many relations, and
bulk/import-export operations.**

If you have not finished Project 1's FABLE guide (`01-task-manager/docs/FABLE.md`),
do that first — this guide assumes you already know the route → controller → service →
model flow and the response envelope.

---

## 1. What is new in this project

| Pattern | Where it lives | Why it matters |
|---|---|---|
| Pagination | `contactModel.js` (limit/offset) + list UI | Every real list endpoint paginates. Interviews love asking about offset vs. cursor. |
| Debounced search | `client/src/features/contacts/useDebounce.js` | Stops one API call per keystroke. First taste of client-side performance thinking. |
| Many-to-many tags | `contact_tags` join table, `tagModel.js`, `tagService.js` | The relational pattern behind labels, categories, permissions — everywhere. |
| Bulk delete | `POST /api/contacts/bulk-delete` | Operating on N rows safely, and why it's a POST, not a DELETE. |
| CSV import/export | `server/src/utils/csv.js`, `/export` and `/import` routes | Data in/out of the system — a boundary where validation really earns its pay. |
| Sortable table + detail view | `client/src/App.jsx` (`ContactTable`, detail panel) | Table-driven UI state: page, sort column, sort direction, search, filters — all at once. |

**Stack:** React 18 + Vite / Express + Knex + PostgreSQL / JavaScript. Two resources
this time: contacts and tags, each with its own routes/controller/service/model pair.

---

## 2. Run it (10 minutes)

```bash
createdb contact_book_dev
cd 02-contact-book/server && npm install && npm run migrate && npm run seed && npm run dev
# in another terminal
cd 02-contact-book/client && npm install && npm run dev
```

The server port comes from `server/src/config/env.js` (default **3002**; override with
`PORT` in `.env` — copy `.env.example` first). Client runs on :5172 (`client/package.json` dev script).

**Prove the new patterns work from the terminal:**

```bash
# pagination + search + sort in one request
curl "http://localhost:3002/api/contacts?page=1&limit=5&search=an&sort=last_name&order=asc"

# CSV out
curl "http://localhost:3002/api/contacts/export"

# bulk delete (note: POST with a body of ids)
curl -X POST http://localhost:3002/api/contacts/bulk-delete \
  -H "Content-Type: application/json" -d '{"ids":[998,999]}'
```

---

## 3. Guided code tour (read in this order)

| # | File | Notice this |
|---|------|-------------|
| 1 | `server/src/routes/contactRoutes.js` | `/export` and `/import` are declared **before** `/:id`. Same route-ordering lesson as Project 1, now with real consequences. |
| 2 | `server/src/services/contactService.js` | How pagination inputs are validated: page < 1 or limit outside 1–100 is rejected with a 400 (the model also caps limit at 100). Unvalidated `limit=100000` is a self-inflicted denial of service. |
| 3 | `server/src/models/contactModel.js` | The list query: `where ilike` search across fields, tag filtering through the join table, `limit/offset`, plus a **separate count query** for total pages. Read this one twice. |
| 4 | `server/src/models/contactModel.js` (`replaceContactTags`) + `tagModel.js` | The join table dance: tags are replaced (delete + insert in a transaction) when a contact is saved — this lives in the contact model, not `tagService.js`. Look for how `ON DELETE CASCADE` avoids orphaned junction rows. |
| 5 | `server/src/utils/csv.js` | Escaping rules (commas, quotes, newlines in fields). CSV is deceptively hard — this file is why you use a battle-tested approach instead of `split(',')`. |
| 6 | `client/src/features/contacts/useDebounce.js` | ~10 lines that teach `useEffect` cleanup properly: set a timer, cancel it on next keystroke. |
| 7 | `client/src/services/api.js` | How query params (page, search, sort, tag) are assembled in one place. |
| 8 | `client/src/App.jsx` (table + toolbar) | The page holds a *bundle* of list state. Count the pieces: page, limit, search, sort, order, tag filter. Now imagine adding one more — where do you touch? |

---

## 4. Trace these two flows

**Search flow (client-driven):** type "mar" in the search box → `useDebounce` waits →
one request with `?search=mar&page=1` → service normalizes → model builds `ilike`
queries → paginated envelope back → table re-renders with new total count.
Question to answer: *why must the page reset to 1 when the search term changes?*

**Import flow (boundary-crossing):** CSV text → `POST /api/contacts/import` →
`csv.js` parses → service validates each row → model inserts. Then answer:
*what should happen when row 40 of 50 is invalid — reject all, skip bad rows, or
insert-then-report? What does this code do, and what would you choose?*
(That question — "what's the failure contract?" — is a mid-level habit.)

---

## 5. The challenge ladder

### Level 1 — Junior
1. **Add a `company` filter** to the contact list, end-to-end (query param → service →
   model → API client → dropdown). You did this in Project 1 with "due today" — measure
   whether you are faster this time. Speed on the second repetition is the actual metric.
2. **Reset page to 1** when search/filters change, if the UI doesn't already — and
   explain the user-facing bug when you don't.

### Level 2 — Mid
3. **Add pagination metadata** you'd want as an API consumer: `totalPages`, `hasNext`,
   `hasPrev` in the list response. Update the client to disable the next button on the
   last page.
4. **Tag with color validation:** enforce that tag colors are valid hex codes on the
   server. Decide where the check belongs (service) and what the error envelope returns.
5. **Make create-contact transactional:** bulk delete is already a single
   `whereIn(...).del()` statement (atomic on its own), but `createContact` inserts the
   contact and writes its tags in separate steps. Wrap both in one `knex.transaction()` — it becomes central in Projects 5, 9, and 10.
6. **Import dry-run mode:** `?dryRun=true` validates the CSV and reports per-row errors
   without inserting. This is a genuinely senior-friendly API design touch.

### Level 3 — Senior
7. **Offset vs. cursor pagination (1 page):** this app uses limit/offset. Explain the
   duplicate/skipped-row bug when rows are inserted between page loads, and sketch a
   cursor design on `(last_name, id)`. When is offset actually fine?
8. **The N+1 audit:** how are tags loaded for a page of 20 contacts — one query, or one
   per contact? Read `contactModel.js` and verify with the actual SQL (add
   `DEBUG=knex:query` to the dev command). If it's N+1, fix it with a single `whereIn`.
9. **Search at scale:** `ilike '%term%'` cannot use a normal index. Write down two
   escalation paths (trigram index, Postgres full-text search) and what each costs.
   You will meet full-text search for real in Project 4.

---

## 6. Questions you should be able to answer afterward

- Why does the list endpoint need two queries (rows + count), and what's the cost of the count?
- Why is bulk-delete a `POST` and not a `DELETE`? (Hint: request bodies on DELETE, and what a URL of 500 ids looks like.)
- Where should the join-table writes live — contact service or tag service — and why?
- What does debouncing trade away? (Perceived latency vs. request volume.)
- Why validate CSV rows on the server when the file came from our own export feature?

## 7. Common traps

- **`%` and `_` in search input** are LIKE wildcards. Search for a literal `%` and watch what happens; decide whether to escape.
- **Count query drift:** filters applied to the rows query but forgotten on the count query → page numbers lie.
- **Debounce without cleanup** fires stale requests that can resolve out of order — the classic "search results flash to the wrong thing" bug.
- **CSV injection:** a field starting with `=` becomes a formula in Excel. Real products prefix it — worth knowing at review time.

Next: Project 3 (`03-expense-tracker`) keeps this skeleton and adds the SQL you actually
get paid for — aggregation, GROUP BY, and dashboard endpoints.
