# FABLE Guide — Kanban Board

**Project 8: the frontend finally gets hard.** Until now the client was a form and a
list. A kanban board is **interaction-heavy UI state**: drag-and-drop, optimistic
updates with rollback, and the sneaky-deep problem of **ordering** — where does "card
position" live in a database, and what happens when two moves race?

Like Projects 4, 6, and 7, this is a working scaffold plus build-labs. The scaffold
gives you flat `cards` CRUD; you build the board on top.

---

## 1. What you get vs. what you build

**You get:** the standard six-file TypeScript scaffold (`routes.ts` → `controller.ts`
→ `service.ts` → `model.ts`) serving `cards` with list/search/stats/CRUD and the
response envelope, plus a one-page React client.

**You build:**

| Upgrade | The lesson inside it |
|---|---|
| Board → lists → cards data model | Modeling one-to-many-to-many hierarchy and shipping a nested `GET /api/board` payload. |
| Drag-and-drop | Wiring a DnD library (`@dnd-kit` recommended) and separating *gesture* state from *data* state. |
| Optimistic reorder | Update the UI instantly, reconcile with the server, roll back on failure — the pattern behind every snappy app. |
| Fractional indexing | Storing order as a sortable value between neighbors so a move is a 1-row `UPDATE`, not a renumber-everything. |

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL.
API on **:4108**, client on :5173.

## 2. Run it (10 minutes)

```bash
createdb kanban_board_dev
cd 08-kanban-board/server && cp .env.example .env
npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 08-kanban-board/client && npm install && npm run dev
```

```bash
curl "http://localhost:4108/api/cards"
curl "http://localhost:4108/api/cards/stats"
```

Scaffold tour: 20 minutes, same order as Project 6 §3. Pay special attention to the
migration (`server/db/migrations/001_init.js`) — Lab 1 extends it.

## 3. The labs

### Lab 1 — The board data model (junior→mid)
Add `lists` (`id, title, position`) and give `cards` a `list_id` and `position`.
Ship `GET /api/board` returning the *whole* nested board in one response:
lists in order, each with its cards in order — assembled in the service from **two
queries** (not one per list; that N+1 reflex should be automatic by now).
Decide `position`'s column type **before** Lab 4 makes you regret an integer:
read ahead, then commit with a comment in the migration explaining the choice.

### Lab 2 — Drag-and-drop (mid)
Wire `@dnd-kit/core` (+ `@dnd-kit/sortable`): drag cards within a list, across lists,
and reorder the lists themselves. The learning is architectural, not library trivia:
- Gesture state (what's being dragged, what's hovered) is **ephemeral component
  state**; board data is **server state**. Keep them apart and the code stays sane.
- On drop you know: card id, source list/index, destination list/index. Design the
  API call: `PATCH /api/cards/:id/move` with `{listId, beforeId?, afterId?}` beats
  `{index}` — write two sentences on why indexes go stale under concurrency.

### Lab 3 — Optimistic move with rollback (mid) — the headline lab
When a card drops: update local state **immediately**, then send the PATCH.
- Success → reconcile with the server's returned card (positions may differ slightly).
- Failure → snapshot-and-restore: put the card back where it was and surface a toast.
- The hard case: the user drags card A, and while the request is in flight, drags
  card B (or A again). Queue the mutations or track in-flight state per card — pick
  one and defend it.
**Prove it:** devtools → network → set offline *after* page load → drag a card → watch
it snap back with an error message, not silently lie.

### Lab 4 — Fractional indexing (mid→senior)
Replace naive integer positions with fractional keys so any move touches **one row**:
- Simplest form: `position` as `numeric`/float, new position = midpoint of neighbors.
  Works until repeated midpointing exhausts precision (~50 moves between the same
  neighbors) — detect and renumber the list when gaps get too small.
- Better form: lexicographic string keys (the `fractional-indexing` npm package, or
  implement `keyBetween(a, b)` yourself for real understanding).
**Senior memo (1 page):** compare `position: integer` + shift-on-insert vs. fractional
keys vs. a linked list (`prev_id`) on: write cost per move, read cost for ordered
fetch, concurrency behavior when two users insert at the same spot, and crash
consistency. Note where each is used in real products (Trello popularized fractional).

### Lab 5 — Stretch: multiplayer feel (senior)
Two browser windows on the same board. Without WebSockets (that's Project 12/19),
get "eventually consistent" via polling + ETag/`updated_at` checks, and make the
optimistic layer merge remote changes without clobbering an in-flight local drag.
Even a partial solution here teaches more about state reconciliation than most jobs do.

## 4. Questions you should be able to answer afterward

- Why does optimistic UI require *idempotent-ish* server semantics, and what makes `{beforeId, afterId}` more robust than `{index}`?
- Where can the board's "truth" live during a drag — DOM order, component state, or server — and what goes wrong when they disagree?
- Why is `position float` + midpoint insertion eventually broken, precisely? (Floating-point midpoints stop being distinct.)
- One `GET /api/board` vs. three composable endpoints (`/lists`, `/cards?listId=`) — argue both, then say which you shipped and why.
- What does React re-render on every drag-over event, and how did you keep it cheap? (Memoized cards, gesture state kept low in the tree.)

## 5. Common traps

- **Refetch-after-move on a board feels broken:** the card teleports back, then jumps forward when the refetch lands. That flash is *why* this project forces optimistic updates — refetch-after-mutation (Project 1's pattern) has hit its limit.
- **Sorting in the client as a crutch:** if the client re-sorts by `position` anyway, a server that returns unsorted lists hides its bugs. Sort in SQL, assert order in tests.
- **DnD accessibility:** `@dnd-kit` supports keyboard sensors — wire them; a mouse-only board fails real review.
- **Two writes for one move** (delete + insert, or update two lists' arrays) is where data loss lives. One move = one row updated.

Next: Project 9 (`09-job-application-tracker`) — the backend strikes back: state
machines, transactional history, and KPI queries.
