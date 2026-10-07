# FABLE Guide — Job Application Tracker

**Project 9: business rules with teeth.** The theme is the **state machine** — the
pattern behind order fulfillment, ticket workflows, deployment pipelines, and every
"status" column that ever mattered. Around it: transactional history (audit trail of
every stage change), file upload wiring, and the KPI queries that turn a pipeline
into a dashboard.

Like Projects 4 and 6–8, this is a working scaffold plus build-labs. The scaffold
serves flat `applications` CRUD; the workflow engine is yours to build.

---

## 1. What you get vs. what you build

**You get:** the standard six-file TypeScript scaffold (`routes.ts` → `controller.ts`
→ `service.ts` → `model.ts`) for `applications` with list/search/stats/CRUD and the
envelope, plus a one-page React client. Crucially, the scaffold's `stage` (and `status`) is just a
string anyone can set to anything — the "before" state of the whole project.

**You build:**

| Upgrade | The lesson inside it |
|---|---|
| Pipeline state machine | Legal transitions only (`applied → screening → interview → offer → accepted/rejected`, `withdrawn` from anywhere). The difference between a status *field* and a status *machine*. |
| Transactional stage history | Every transition writes the application AND a history row atomically — Project 5's transactions, now structural. |
| Resume upload | Multipart handling (`multer`), what goes in the DB vs. on disk, and validating files (the trap: trusting extensions). |
| KPI dashboard queries | Conversion rates per stage, time-in-stage, applications per week — SQL that answers manager questions. |

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL.
API on **:4109**, client on :5173.

## 2. Run it (10 minutes)

```bash
createdb job_tracker_dev
cd 09-job-application-tracker && cp .env.example .env && cd server   # server/src/config/env.ts loads ../.env
npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 09-job-application-tracker/client && npm install && npm run dev
```

```bash
curl "http://localhost:4109/api/applications"
# the "before" state — an illegal jump the scaffold happily allows:
curl -X PUT http://localhost:4109/api/applications/1 \
  -H "Content-Type: application/json" -d '{"stage":"accepted"}'
```

Scaffold tour: 20 minutes, same reading order as Project 6 §3.

## 3. The labs

### Lab 1 — The state machine (mid) — the headline lab
Define the machine as **data**, not scattered `if`s:

```ts
const TRANSITIONS: Record<Stage, Stage[]> = {
  applied:    ["screening", "rejected", "withdrawn"],
  screening:  ["interview", "rejected", "withdrawn"],
  interview:  ["offer", "rejected", "withdrawn"],
  offer:      ["accepted", "rejected", "withdrawn"],
  accepted:   [],
  rejected:   [],
  withdrawn:  [],
};
```

- New endpoint: `POST /api/applications/:id/transition` with `{to, note?}`. Illegal
  transitions → 409 with a message naming the allowed next stages.
- **Remove `stage` from the fields a plain `PUT` may touch** (edit the service's
  allow-list) — a state machine you can bypass isn't one. The curl in §2 must now fail.
- Terminal states (`accepted`/`rejected`/`withdrawn`) accept no transitions; decide
  whether a "reopen" escape hatch exists and who may use it — write the decision down.
**Prove it:** a test walks the happy path to `accepted` and asserts every illegal jump
409s along the way.

### Lab 2 — Transactional stage history (mid)
New table: `stage_history (id, application_id, from_stage, to_stage, note, created_at)`.
Every transition must write the application update **and** the history row in one
`knex.transaction` — if either fails, neither persists (you proved this pattern in
Project 5; here it becomes load-bearing).
- `GET /api/applications/:id/history` returns the timeline; render it in the client
  as a vertical timeline component.
- The subtle question: current stage is now stored twice (column + last history row).
  Which is authoritative? Add a consistency check or derive one from the other, and
  document the choice — this is the "materialized vs. derived" debate in miniature.

### Lab 3 — Resume upload (mid)
`POST /api/applications/:id/resume` accepting one PDF via `multer`.
- Store the **file on disk** (an `uploads/` dir) and the **metadata in the DB**
  (filename, size, mime, path); never the bytes in a column. Serve it back with a
  download route.
- Validate for real: extension checks lie — sniff the magic bytes (`%PDF`), cap size
  (5MB), and generate your own stored filename (never trust the client's, and know
  which path-traversal attack `../../etc/cron.d/x.pdf` is attempting).
- Write 5 lines on what changes when this moves to S3-style object storage
  (presigned URLs, and the DB stores a key, not a path).

### Lab 4 — KPI queries (mid→senior)
Extend `/api/applications/stats` (or add `/api/stats/funnel`) with SQL you write
yourself, verified against seed data by hand:
1. **Funnel:** how many applications *ever reached* each stage (from `stage_history`,
   not the current-status column — understand why they differ).
2. **Conversion:** of applications that reached `interview`, what fraction reached
   `offer`?
3. **Time-in-stage:** average days between `applied` and first `interview`
   (`LAG()`/window functions or self-join on history — try the window function; this
   is the project to learn it).
4. **Velocity:** applications created per ISO week for the last 12 weeks, zero-filled
   (you met the gap-filling problem in Project 3's yearly stats — same trick).
Render at least the funnel client-side.
**Senior memo (1 page):** these queries scan history on every dashboard load. At what
scale does that hurt, and what are the escalation steps (indexes → materialized view →
event-sourced aggregates)? When is the boring answer ("an index, it's fine") correct?

## 4. Questions you should be able to answer afterward

- Why encode transitions as data instead of `if (from === 'applied' && to === 'screening') ...`? Name three concrete wins (testability, docs/UI generation, diffable policy).
- Why 409 (not 400) for an illegal transition? What's the semantic difference?
- What exactly does the transaction in Lab 2 protect against — name the failure that corrupts data without it.
- History table vs. `updated_at` column: what questions can only the history answer?
- Why must the funnel KPI read history rather than current status? (An application now `rejected` still *reached* interview.)

## 5. Common traps

- **Enforcing the machine only in the UI:** hiding illegal buttons is UX; the service check is the guarantee. Both, always.
- **Race on concurrent transitions:** two tabs both move `applied → screening`. Guard with `WHERE stage = :from` in the UPDATE and check affected-row count — optimistic concurrency in one line.
- **History without `from_stage`:** you can reconstruct it by ordering, until one row is deleted or backfilled. Store both ends of the edge.
- **`multer` file dropped before validation:** validate *then* persist to the final location; clean up temp files on the reject path.

Next: Project 10 (`10-inventory-management`) — the same rigor applied to numbers that
must never drift: stock ledgers, orders, and reporting SQL.
