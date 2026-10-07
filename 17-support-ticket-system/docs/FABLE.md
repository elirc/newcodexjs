# FABLE Guide — Customer Support Ticket System

**Project 17: the enterprise kit meets an SLA clock.** This app shares its scaffold
with Project 16 — same soft delete, audit log, request context, saved views, bulk ops,
readiness endpoint — so **read Project 16's FABLE guide first**; this one won't repeat
the kit. What's different here is the domain, and it's a demanding one: support
tickets live under **time pressure (SLAs)**, flow through **queues owned by teams**,
and mix **customer-visible and internal** information in one thread. Those three
pressures drive every lab below.

**Domain specifics:** tickets with `status` `open → pending → escalated → resolved`
(+ `archived`), priority `low/medium/high/urgent`, team-scoped queues, internal
comments (`is_internal` on the comment model — the scaffold already carries the flag,
but no read path filters on it), SLA hours only as a number inside `metadata`, bulk
*status* moves (there is no assignment endpoint), and an audit trail pitched as
"customer-impacting actions." Team scoping is stamped (`team_id`) but not enforced on reads.

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL. API on **:4117**.

## 1. Run it (10 minutes)

```bash
# the server loads ../.env (relative to server/), i.e. a project-root .env:
cd 17-support-ticket-system && cp .env.example .env   # create the DB_NAME it names
cd server && npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 17-support-ticket-system/client && npm install && npm run dev
```

```bash
curl "http://localhost:4117/api/tickets?status=open&sort=priority&order=desc"
curl "http://localhost:4117/api/tickets/dashboard"
# internal vs public comment — the flag that runs this whole domain:
curl -X POST http://localhost:4117/api/tickets/1/comments -H "content-type: application/json" \
  -H "x-demo-role: operator" -d '{"body":"customer can see this","is_internal":false}'
curl -X POST http://localhost:4117/api/tickets/1/comments -H "content-type: application/json" \
  -H "x-demo-role: operator" -d '{"body":"escalating, customer is furious","is_internal":true}'
# note: GET .../comments returns both; nothing filters on is_internal yet,
# and the bundled UI posts every comment with is_internal=true
```

**Orientation pass (30 min):** skim `server/src/services/service.ts` and
`models/model.ts` diffing them *mentally against Project 16's* — the deltas (status
enum, priority enum, domain fields) are the whole read. Then check `docs/journal.md`
for this domain's rationale.

## 2. What this domain teaches (that 16 didn't)

1. **Priority is a promise, not a sort key.** `urgent` means "respond in 1h" only if
   something *measures* it. An SLA is priority converted into deadlines and breach
   states.
2. **Two audiences in one thread.** `is_internal` is a one-bit permission system.
   The moment a customer-facing view exists, one wrong `WHERE` clause becomes an
   incident ("customer saw the internal notes"). Treat that flag with Project 7-level
   (sanitization boundary) seriousness.
3. **Queues are shared mutable state.** Two agents grab the same ticket; bulk triage
   reassigns 50 tickets while one of them is being edited. Assignment needs the same
   race discipline as Project 10's stock.

## 3. The challenge ladder

### Level 1 — Junior
1. **Triage view presets:** create saved views for the classic queues — "Unassigned
   urgent," "Escalated today," "Mine, open" — and make the client render them as
   one-click tabs. (Closes Project 16's Lab 4 loop, in the domain it was invented for.)
2. **Status-transition sanity:** the scaffold accepts any status value from the
   allow-list in any order. Add Project 9's transitions-as-data machine for
   `open → pending → escalated → resolved` (define your own edges, including what
   reopens a resolved ticket) with 409s on illegal jumps — single *and* bulk paths.

### Level 2 — Mid
3. **SLA engine, minimal honest version:** add `first_response_due_at` and
   `resolve_due_at`, computed at creation from priority (e.g., urgent = 1h/8h,
   low = 24h/7d, table-driven). First public agent comment stamps
   `first_responded_at`; resolution stamps `resolved_at`. List endpoint gains
   `slaState`: `ok / at_risk / breached` (computed, not stored — argue why in a
   comment). Dashboard gains a breach count.
4. **Assignment with a claim race:** add `assignee` + a `POST /:id/claim` endpoint.
   Two agents claim simultaneously → exactly one wins
   (`UPDATE ... WHERE assignee IS NULL` + affected-rows check — the Project 10 guard,
   verbatim). Bulk-assign must respect already-claimed tickets and report skips.
5. **The customer view:** a second, restricted read path — ticket + **public comments
   only**, no internal flags leaking through `metadata`, audit, or comment counts.
   Then write the test that tries to leak internal data through *every* read endpoint.
   This is the lab that earns the project its place.

### Level 3 — Senior
6. **Business-hours SLA memo (1 page):** "respond in 8h" — wall clock or business
   hours? Design the calendar-aware version (business-hour arithmetic, per-team
   timezones — Project 14's wall-clock-vs-instant split returns) and honestly assess
   whether computing `at_risk` on read still works, or whether you now need a
   scheduled sweep that *materializes* breach state (and re-opens the compute-vs-store
   ledger debate from Project 10).
7. **Escalation policy as data:** who may escalate, what escalation changes (priority?
   team? SLA clock reset — surely not?), and how the audit log proves an SLA breach
   wasn't caused by mis-triage. Sketch the rules table and the three audit queries a
   support manager would actually run.

## 4. Questions you should be able to answer afterward

- Why compute `slaState` on read at this scale, and what forces materialization later? (Volume, sorting *by* breach state, notifications on breach.)
- What exactly does `is_internal` protect, and which layer must enforce it — client, service, or query? (Only one answer survives a code review.)
- Why must "claim" be one guarded UPDATE rather than check-then-assign in the service?
- What makes a bulk triage action harder to audit than a single one, and how does the request id from the context middleware fix it?
- When a ticket is soft-deleted, what happens to the customer's view of their own history? (Soft delete's visibility rules, per audience.)

## 5. Common traps

- **SLA clocks in local time:** due-at timestamps must be UTC instants; business-hours math converts at the edges (Project 14's rule).
- **`is_internal` filtered in the client only** — grep for where the filtering happens before believing the UI. (Here: nowhere. `listComments` returns every comment.)
- **Reopen semantics:** customer replies to a `resolved` ticket. Auto-reopen? New ticket? Whatever you choose, the SLA clocks need a defined answer too.
- **Priority inflation:** when everything is urgent nothing is — a `priority_changed` audit entry with actor is the honest countermeasure, and the scaffold's audit log already gives you the hook.

Next: Project 18 (`18-learning-management-system`) — same kit, publication-lifecycle
domain: draft → review → published content with curriculum structure.
