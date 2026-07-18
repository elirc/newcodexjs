# FABLE Guide — Learning Management System

**Project 18: the enterprise kit meets a publication lifecycle.** Same scaffold as
Project 16 (soft delete, audit, request context, saved views, bulk ops) — **read
Project 16's FABLE guide first**. The domain twist here is that a course is
**published content**: it moves `draft → review → published → retired` (+ `archived`),
it is *consumed* by an audience (students) who must never see the editorial sausage
being made, and it eventually grows **structure** (modules, lessons, enrollments,
progress) that turns a flat record into the deepest hierarchy in the curriculum.

**Domain specifics:** school-scoped courses, `status`
`draft/review/published/retired/archived`, priority reused as merchandising weight
(`low/medium/high/featured` — note the scaffold's "priority" concept bent to a new
meaning; that bending is itself a lesson), review comments, saved instructor views,
bulk status operations, audit log pitched at curriculum changes.

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL. API on **:4118**.

## 1. Run it (10 minutes)

```bash
# create the DB named in server/.env.example, then:
cd 18-learning-management-system/server && cp .env.example .env
npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 18-learning-management-system/client && npm install && npm run dev
```

```bash
curl "http://localhost:4118/api/courses?status=published"
curl "http://localhost:4118/api/courses/dashboard"
curl -X POST http://localhost:4118/api/courses/bulk/status -H "content-type: application/json" \
  -H "x-role: operator" -d '{"ids":[1,2],"status":"review"}'
curl "http://localhost:4118/api/courses/audit?limit=10"
```

**Orientation pass (30 min):** diff `services/service.ts` and `models/model.ts`
mentally against Project 16's; the deltas are the domain. Then `docs/journal.md`.

## 2. What this domain teaches (that 16 and 17 didn't)

1. **Publication is a one-way-ish door.** `published` content has an audience;
   "editing" it is not like editing a draft. Every serious CMS/LMS eventually
   separates *published version* from *working version* — this project is where you
   feel why.
2. **Review is a workflow, not a status.** `review` implies a reviewer, an approval
   action, and a rejection path with feedback (the review comments are already here).
3. **Hierarchy with ordering.** Courses → modules → lessons is Project 11's
   survey→question→option tree, at greater depth and with a consumer (student
   progress) attached.

## 3. The challenge ladder

### Level 1 — Junior
1. **Lifecycle machine:** transitions-as-data (Project 9) for
   `draft → review → published → retired`, with rejection (`review → draft`) carrying
   a required comment. Illegal jumps 409; bulk path included (bulk-publish must
   refuse drafts that never passed review — partial-result contract from P16 Lab 5).
2. **Public catalog projection:** `GET /api/catalog` returning only `published`
   courses with a trimmed field set (no review comments, no audit hints, no
   `metadata` internals). The student-facing read path, and your reflexes from
   P17's customer view apply verbatim.

### Level 2 — Mid
3. **Modules and lessons:** two new tables under courses with `position` ordering,
   nested create/edit/reorder endpoints, and a single `GET /api/courses/:id/outline`
   assembled in two or three queries (no N+1 — that reflex should be involuntary by
   now). Reuse Project 11's reorder-integrity rules.
4. **Enrollment + progress:** `enrollments (course_id, student, enrolled_at)` and
   `lesson_completions (enrollment_id, lesson_id, completed_at)`. Course progress =
   completions / published lessons — computed where? (Read-time SQL first; note when
   you'd materialize, citing the P10/P17 debate.) Guard: students enroll only in
   `published` courses; completions only for lessons in courses they're enrolled in.
5. **The published-edit problem, minimal version:** block structural edits (module/
   lesson deletion, reordering) on `published` courses unless the actor takes an
   explicit `?force=true` with an audit entry, while allowing typo-level field edits.
   Crude — but it forces you to *classify* edits by blast radius, which is the skill.

### Level 3 — Senior
6. **Versioning design memo (1 page):** the real solution to Lab 5 — draft-vs-published
   versions. Compare: (a) full row copy per publish (course_versions), (b) immutable
   published snapshots as JSON, (c) event-sourced edits. Cover: what students mid-course
   see when v2 publishes (grandfathering!), storage cost, query complexity, and what
   progress tracking attaches to (lesson identity across versions is the killer
   detail — spell it out).
7. **Retire vs. archive vs. delete:** three end states now exist (`retired`,
   `archived`, soft-deleted). Write the semantics table — who can still see what, do
   enrolled students keep access to retired courses, which dashboards count which —
   and reconcile it with the scaffold's `includeArchived` flag. Ambiguity here is
   exactly the kind of thing senior engineers are paid to eliminate *in writing*.

## 4. Questions you should be able to answer afterward

- Why does published content need a projection (trimmed read model) rather than the admin serializer with fields removed client-side?
- What breaks if course progress divides by *all* lessons rather than lessons that existed when the student enrolled? (The versioning problem, sneaking in through arithmetic.)
- Why does rejection require a comment while approval doesn't — and where is that enforced?
- The scaffold reused `priority` as `featured` merchandising weight: cheap win or naming debt? What's the refactor cost curve?
- Which of the three end states (retired/archived/deleted) belongs in the audit log's "customer-impacting" category, and what does that mean for retention?

## 5. Common traps

- **Progress rows outliving their lesson:** delete (or unpublish) a lesson and completions dangle — decide FK behavior *and* progress-math behavior together, or percentages exceed 100.
- **Bulk-publish as the review bypass:** any rule enforced on single transitions must hold on the bulk path (P16 Lab 5's warning, now with editorial stakes).
- **Outline endpoint drifting from reality:** if `outline` is assembled from cached/joined data, a reorder must invalidate it — sort in SQL, test the order.
- **`school_id` scoping** has Project 16's `workspace_id` enforcement gap. Same audit, same fix.

Next: Project 19 (`19-realtime-chat-platform`) — the kit meets Project 12's chat
domain, and the road finally leads to WebSockets.
