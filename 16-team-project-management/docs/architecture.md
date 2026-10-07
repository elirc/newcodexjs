# Team Project Management Architecture

> **Shared origin.** Projects 16-20 were generated from one template by [`scripts/generate-projects-16-20.mjs`](../../scripts/generate-projects-16-20.mjs) and [`scripts/enhance-projects-16-20.mjs`](../../scripts/enhance-projects-16-20.mjs), then hardened in a later pass. Routes and request-context middleware are byte-identical across the five apps; services, models and migrations differ mainly in table names, status and priority lists, and a few lines (see each project's own `docs/architecture.md`). This document is the full walkthrough of the template using this project's files; `path:line` references were checked on 2026-10-06.

## System Shape

```text
React workspace (client/src/App.tsx)
  -> typed API client (client/src/services/api.ts)
  -> Express middleware: helmet, CORS, request context, logging, JSON, object-body guard
  -> routes/routes.ts -> controllers/controller.ts
  -> services/service.ts: validation, role checks, list clamping
  -> models/model.ts: Knex with transactions, audit and activity writes
  -> PostgreSQL: tasks lifecycle, comments, saved views, audit_log, activity_events
```

## Production-Oriented Additions (verified)

- `/ready` runs `select 1` against the database (`server/src/app.ts:41-51`), separate from `/health` (`:35-40`).
- Request context assigns a request id (echoed in the `x-request-id` response header), an actor and a role (`middleware/requestContext.ts:21-26`).
- The list endpoint supports search, status and priority filters, pagination and an allow-listed sort (`services/service.ts:37-52`, `models/model.ts:23-52`).
- Delete is soft delete (`deleted_at`); archive/restore is a separate lifecycle with `status_before_archive` (`model.ts:142-206`, `:322-333`).
- Comments, saved views, the audit log and activity events model collaboration and traceability.
- Every write that touches a task plus its audit and activity rows runs in one transaction (`createRecord`, `updateRecord`, `bulkStatus`, `lifecycleUpdate`, `addComment` all use `db.transaction`).

## Main Boundaries

| Layer | Owns | File |
| --- | --- | --- |
| UI | filters, selected rows, comments panel, saved-view action | `client/src/App.tsx` |
| Client API | demo headers, route URLs, envelope unwrap | `client/src/services/api.ts` |
| Controller | request/response translation | `server/src/controllers/controller.ts` |
| Service | validation, role checks, lifecycle rules | `server/src/services/service.ts` |
| Model | SQL, transactions, audit/activity writes | `server/src/models/model.ts` |
| Migration | lifecycle, collaboration and audit schema | `server/db/migrations/` (001-003) |

## Data model

| Table | Defined in | Key columns |
|---|---|---|
| `workspaces` | `001_init.ts:4-8` | `name` |
| `tasks` | `001_init.ts:10-24`, extended in `002_enterprise_features.ts:4-12` and `003_archive_status.ts:3-5` | `workspace_id` FK, `title` (220), `status` (default `'active'`, no `CHECK`), `priority`, `owner`, `metadata` jsonb, `due_at`, `risk_level`, `version`, `archived_at`, `deleted_at`, `status_before_archive` |
| `activity_events` | `001_init.ts:26-37` | `task_id`, `event_type`, `message`, `payload` jsonb |
| `comments` | `002_enterprise_features.ts:14-25` | `task_id`, `author`, `body`, `is_internal` |
| `saved_views` | `002_enterprise_features.ts:27-38` | `workspace_id`, `name`, `filters` jsonb, `created_by` |
| `audit_log` | `002_enterprise_features.ts:40-54` | `task_id` (`ON DELETE SET NULL`), `actor`, `action`, `before`/`after` jsonb, `request_id` |

Allowed values live only in the service: statuses `todo, in_progress, blocked, done, archived` and priorities `low, medium, high, critical` (`service.ts:4-5`). The column default `'active'` (`001_init.ts:18`) is not one of them; it is never used because `sanitizePayload` defaults `status` to `todo` on create (`service.ts:131`).

## Identity and roles (as implemented)

`requestContext` reads `x-demo-user` (default `demo.user@example.com`) and `x-demo-role` (default `operator`) (`requestContext.ts:22-23`). The client sends `junior.operator@example.com` / `operator` (`client/src/services/api.ts:6-10`). `requireOperator` accepts `operator`, `admin` or `manager` and otherwise throws a 400 `ValidationError` (`service.ts:29-35`). It guards create, update, remove, archive, restore, bulk status and saved-view creation; reads and `addComment` are not gated.

## Request trace: editing a task (the core write)

1. `saveRecord` in `client/src/App.tsx:99-108` calls `updateRecord(editingId, form)` (or `createRecord(form)`), then refreshes.
2. `client/src/services/api.ts:59-61` sends `PUT /api/tasks/:id` with the demo headers.
3. `app.ts:17` builds the request context, `app.ts:23` parses JSON (1 MB), `app.ts:24-33` rejects non-object bodies, and `app.ts:53` mounts the router at `/api/tasks`.
4. `routes.ts:17` maps `PUT /:id` to `controller.update` (`controller.ts:52-57`).
5. `service.ts:157-169`: `requireOperator`, a 404 check via `get` (`:146-150`), then `sanitizePayload(payload, true)` (`:54-140`): allow-listed keys only, trimmed strings with length limits, status/priority enums, metadata must be an object under 20,000 characters, `due_at` must be a real ISO date, and a partial edit must change at least one field.
6. `model.ts:75-97`: in a transaction, lock the live row (`forUpdate`, `:81`), update it with `statusFields` (keeps `archived_at` and `status_before_archive` consistent when status changes, `:322-333`), bump `version` (`:89`), then write an activity event and an audit row with before/after snapshots (`:93-94`, `writeActivity` `:288-301`, `writeAudit` `:303-319`).
7. The test "partial edit preserves omitted values; invalid edits leave stored values unchanged" (`test/crud.test.ts:19`) pins this path.

Bulk status (`service.ts:188-204` then `model.ts:99-140`) de-duplicates ids, caps the distinct set at 100, locks all rows in id order and fails the whole batch with 404 if any id is missing ("bulk status rejects missing IDs atomically...", `crud.test.ts:53`; "the bulk cap counts distinct ids...", `:92`).

## Senior findings (verified in source)

1. **Every caller is an operator by default.** The role comes from a client header and defaults to `operator` when absent (`requestContext.ts:23`), so `requireOperator` passes for any request that sends nothing. Failures are 400 `VALIDATION_ERROR`, not 403.
2. **Raw error messages leak.** `errorMiddleware` wraps unknown errors as `new AppError(error.message)` (`middleware/errorMiddleware.ts:19-20`), so a Postgres error (for example a foreign-key violation from `workspace_id: 999`, which `sanitizePayload` only checks for being a positive integer, `service.ts:122-128`) is returned to the client verbatim with a 500.
3. **`version` is counted but never checked.** Updates increment `version` (`model.ts:89`, `:124`, `:194`) but no endpoint accepts an expected version, so two editors silently overwrite each other (lost update).
4. **Workspace is stamped, not enforced.** `listRecords`, `findRecord`, `dashboard`, `activity` and `auditLog` never filter by `workspace_id` (`model.ts:19-56`, `:250-286`); only saved views filter by it (`:244-248`). Any caller reads every workspace. Comment `author` is also client-supplied (`service.ts:218`), independent of the audited actor.

## Debugging scenario

Symptom: restoring an archived task brings it back as `todo` instead of `blocked`. Path: `restoreRecord` (`model.ts:154-161`) calls `lifecycleUpdate`, which sets `status = before.status_before_archive || "todo"` (`:181-186`). So `status_before_archive` was null. It is written by `statusFields` when status becomes `archived` (`:324-331`), and cleared by any non-archive status change (`:332`). Check the history: `SELECT action, before->>'status', after->>'status', after->>'status_before_archive' FROM audit_log WHERE task_id = <id> ORDER BY id;`. A row created directly by SQL, or archived before migration `003_archive_status.ts` existed, has no saved status and restores to `todo`.

## Exercise ladder (junior to mid)

1. **Goal:** list what each demo header controls. **Check:** `grep -rn "x-demo-\|x-request-id" server/src client/src` shows `requestContext.ts:21-26`, the morgan format in `app.ts:20`, and the client headers at `api.ts:8-9`; note that headers named `x-actor` or `x-role` are not read anywhere.
2. **Goal:** find every query that skips `deleted_at`. **Check:** in `model.ts`, every task read goes through `baseQuery` (`:19-21`) except `dashboard`'s archived count, which adds `whereNull("deleted_at")` itself (`:262-266`); comments, activity and audit reads (`:230-232`, `:277-286`) do not filter by the task's deletion state.
3. **Goal:** return 403 for role failures and hide internal errors. **Check:** a `ForbiddenError` (403) is thrown by `requireOperator`, and `errorMiddleware` returns a generic message for non-`AppError`s; a test sending `x-demo-role: viewer` expects 403. Run locally (needs Postgres): `npm test` with `ASTRA_TEST_DATABASE_URL` set to an `astra_test_*` database (`test/database.ts`).
4. **Goal:** add optimistic concurrency. **Check:** `PUT /api/tasks/:id` requires `version`, the model updates `WHERE id = ? AND version = ?`, and a stale version returns 409 with the row unchanged.
5. **Goal:** enforce workspace tenancy. **Check:** the workspace comes from request context, every model query filters by it, and a test proves a task in workspace 2 is invisible to a workspace-1 caller.

## Scale Risks To Discuss

- Audit and activity tables grow without retention; `activity()` returns only the latest 30 events with no filter (`model.ts:277-282`).
- Saved views need visibility and ownership rules; today anyone can list any workspace's views by query parameter (`service.ts:248-250`).
- Bulk operations need rate limiting and confirmation UX.
- Demo request headers must become real authentication before production.
- `search` uses `ILIKE '%term%'` (`model.ts:29`), which cannot use the existing b-tree indexes.

See `docs/journal.md` for the teaching narrative behind these choices.
