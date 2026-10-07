# FABLE Guide — Team Project Management

**Project 16: the enterprise pattern kit — read this one deeply.** Projects 16–20 are
five apps built from the same compact scaffold (about 1,150 lines of `server/src` + `client/src` TypeScript here), each
wearing a different domain. The scaffold's point is a set of patterns that separate
"app that works" from "app a company can operate": **soft delete, archive/restore,
audit logs, request context (actor + request id), saved views, bulk operations, role
gates, and a readiness endpoint.** This tasks app is the canonical instance — study it
here, then treat 17–20 as domain-specific labs.

Companion reading: `docs/journal.md` in this folder explains *why* each pattern was
chosen, with trade-offs. Read it after the code tour — it's the voice of the code
reviewer you want to become.

---

## 1. The pattern kit (what to actually learn here)

| Pattern | Where | The idea |
|---|---|---|
| Soft delete | `model.ts` — `softDeleteRecord`, `deleted_at` filtering | Delete hides, never destroys. The model owns the default filter so nobody forgets it. |
| Archive ≠ delete | `PATCH /:id/archive` / `/restore`, `includeArchived` query | Two lifecycles: archived is *done but reportable*; deleted is *hidden from operations*. Conflating them is a classic data-model smell. |
| Request context | `middleware/requestContext.ts` → `Context = {actor, requestId, role}` | Every write can answer "who did this, in which request?" — the prerequisite for audit, debugging, and support. |
| Audit log | model writes audit rows alongside mutations; `GET /api/tasks/audit` | The operational ledger (Project 10's idea applied to *actions* instead of stock). |
| Role gate | `service.ts#requireOperator` — operator/manager/admin | Authorization as an explicit, greppable check at the top of each mutating service function (except `addComment`). Note the role header defaults to `operator`, so the gate passes when no header is sent. |
| Saved views | `views` endpoints, filters stored as JSON | User-defined filter bundles — the feature that turns a list into a workflow tool. |
| Bulk operations | `POST /api/tasks/bulk/status` | N records, one request, one validation pass — and one audit story. |
| Bounded lists | `normalizeListQuery`: `pageSize` capped at 100, page at 10000, sort allow-listed | Every list input clamped. Compare with Project 2's pagination — same idea, now defensive by default. |
| Readiness | readiness endpoint in `app.ts`/routes | "Can I serve traffic?" as an endpoint — what load balancers and k8s actually call. |

**Domain:** workspace-scoped tasks with `status` (todo/in_progress/blocked/done/archived),
`priority` (low/medium/high/critical), `owner`, `risk_level`, `due_at`, and a free-form
`metadata` JSON column. Dashboard aggregates + activity feed included.

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL. API on **:4116**.

## 2. Run it (10 minutes)

```bash
# the server loads ../.env (relative to server/), i.e. a project-root .env:
cd 16-team-project-management && cp .env.example .env   # create the DB_NAME it names
cd server && npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 16-team-project-management/client && npm install && npm run dev
```

**Drive the pattern kit, not just the CRUD:**

```bash
# clamped pagination + filters
curl "http://localhost:4116/api/tasks?page=1&pageSize=25&status=in_progress&sort=priority"

# a write carries context — then find it in the audit log
curl -X POST http://localhost:4116/api/tasks -H "content-type: application/json" \
  -H "x-demo-user: fable-reader" -H "x-demo-role: operator" \
  -d '{"title":"study the audit trail","priority":"high"}'
curl "http://localhost:4116/api/tasks/audit?limit=5"

# lifecycle: archive, prove it vanishes from default lists, restore
curl -X PATCH http://localhost:4116/api/tasks/1/archive -H "x-demo-role: operator"
curl "http://localhost:4116/api/tasks" | grep -c '"id":1'          # gone
curl "http://localhost:4116/api/tasks?includeArchived=true"        # back
curl -X PATCH http://localhost:4116/api/tasks/1/restore -H "x-demo-role: operator"

# bulk + views + dashboard
curl -X POST http://localhost:4116/api/tasks/bulk/status -H "content-type: application/json" \
  -H "x-demo-role: operator" -d '{"ids":[2,3],"status":"done"}'
curl "http://localhost:4116/api/tasks/dashboard"
```

(Context headers, from `middleware/requestContext.ts`: `x-demo-user`, `x-demo-role`
(defaults to `operator`, so the role headers above are optional) and `x-request-id`.
Actor/role/request-id arrive as demo headers, the grown-up sibling of P11–14's stubs.)

## 3. Guided code tour (read in this order)

| # | File | Notice this |
|---|------|-------------|
| 1 | `server/src/middleware/requestContext.ts` | How headers become a typed `Context` on the request. Every service mutation takes `context` as its last parameter — trace one all the way to the audit row. |
| 2 | `server/src/services/service.ts` (262 lines — read it all) | `normalizeListQuery` (clamps everything), `sanitizePayload` (allow-list + defaults + enum checks), `requireOperator` at the top of every mutation, and how comments/views/bulk each get their own small validation. This file is a compact map of mid-level service design. |
| 3 | `server/src/models/model.ts` (333 lines) | Where `deleted_at is null` gets applied (count the query builders that include it — is it *every* one?), how audit rows are written relative to the mutation (same transaction or not? — this matters, verify), and the dashboard aggregates. |
| 4 | `server/src/routes/routes.ts` | The full surface from the README's highlights. Note which routes skip `requireOperator` (reads, comments?) and whether that's right. |
| 5 | `client/src/App.tsx` (242 lines) | One file driving list + filters + lifecycle + comments against the API — a serviceable ops UI in an afternoon's read. |
| 6 | `docs/journal.md` | The rationale: soft delete trade-offs, archive semantics, why request ids. Read last so you can argue with it. |

## 4. The challenge ladder

### Level 1 — Junior
1. **Add a `blocked_reason` field** required when (and only when) status is `blocked` —
   a conditional validation rule, which the current `sanitizePayload` shape doesn't
   support cleanly. Feel that friction; it's the argument for schema validators (Zod,
   P11) over hand-rolled checks.
2. **Audit completeness check:** perform one of each mutation (create, update, archive,
   restore, soft delete, bulk), then read the audit log. Is every action there, with
   actor and request id? Any gaps → fix the model call sites.

### Level 2 — Mid
3. **Make the audit write atomic:** if audit rows aren't written in the same
   transaction as the mutation (verify in `model.ts`), wrap them. Then write the
   two-sentence justification: an audit log that can silently miss writes is worse
   than none, because it *testifies*.
4. **Saved views, closed loop:** views store filters as JSON, but does the client let
   you *apply* one with a click, and does applying one produce exactly the same
   normalized query as building the filters manually? Close whatever's open, and
   validate stored filters against the same allow-lists on read (defense against
   stale/hand-edited JSON).
5. **Bulk operation contract:** `bulk/status` with ids `[2, 999999, 3]` — what happens?
   All-or-nothing, or partial with a report? Implement the *explicit* version: response
   lists `updated: []` and `skipped: [{id, reason}]`, atomically. This
   partial-failure contract question is Project 2's CSV import lesson, promoted to
   first-class API design.

### Level 3 — Senior
6. **Workspace scoping audit:** `workspace_id` exists (default 1) but is it actually
   *enforced* — can a request read or mutate across workspaces? Design real tenancy:
   workspace from context, every query filtered, every write stamped. Then the memo:
   what schema-level guarantee (composite FKs? RLS?) backs the service discipline, and
   what a missed filter leaks. This is the multi-tenancy interview question, live.
7. **Soft delete's hidden costs (1 page):** unique constraints now collide with dead
   rows (`title` unique? not anymore), foreign keys point at "deleted" parents, counts
   and dashboards must agree on visibility, and GDPR wants *actual* erasure. Propose
   the mitigations (partial unique indexes `where deleted_at is null`, purge jobs) and
   when hard delete is simply correct.
8. **Readiness vs. liveness:** what does the readiness endpoint actually check (DB
   ping?), what *should* it, and why do orchestrators need ready≠alive to avoid
   restart loops during a DB outage?

## 5. Questions you should be able to answer afterward

- Why does the *model* own the `deleted_at` filter instead of every caller? What bug class does that placement eliminate?
- What's the operational difference between archive and soft delete — give one query each pattern serves that the other can't.
- Why do audit rows want a `request_id`, not just actor+timestamp? (Correlating one user action across N writes and log lines.)
- Why clamp `pageSize` server-side when the UI never sends more than 25?
- Where should role checks live as they grow past `requireOperator` — and what did Project 5's Level 3 predict about this?

## 6. Common traps

- **The one query that forgets `deleted_at is null`** — usually the dashboard aggregate or search. Audit for it; it's practically a tradition.
- **Restoring into a broken state:** restore a task whose workspace/parent was deleted meanwhile. Decide the rule before it decides itself.
- **Bulk endpoints skipping per-record rules:** single-update validates status transitions (if you add them); bulk must not become the bypass lane.
- **Metadata JSON as a dumping ground:** `metadata` is convenient until queries need what's inside it. The moment a filter wants a metadata key, promote it to a column — write that rule down.

Projects 17–20 reuse this exact kit: **17** tickets (SLA/triage), **18** courses
(publication lifecycle), **19** conversations (the road back to real-time), **20**
listings (moderation/marketplace). Their FABLE guides assume you've read this one.
