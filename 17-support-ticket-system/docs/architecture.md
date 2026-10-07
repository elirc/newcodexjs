# Customer Support Ticket System Architecture

> **Shared origin and honesty note.** This app was generated from the same template as Projects 16-20 ([`scripts/generate-projects-16-20.mjs`](../../scripts/generate-projects-16-20.mjs), then [`scripts/enhance-projects-16-20.mjs`](../../scripts/enhance-projects-16-20.mjs)). Its routes and request-context middleware are byte-identical to Project 16's, and its service and model differ only in names, the status/priority lists and a few lines. The generator's project config lists support tables (`customers`, `ticket_messages`, `sla_events`), but only the first entry (`teams`) was ever used to create a table; there is no customer, message-thread or SLA schema. So this document is shorter than Projects 11-15's: it covers what is specific to this codebase and points to [`16-team-project-management/docs/architecture.md`](../../16-team-project-management/docs/architecture.md) for the full template walkthrough. Line numbers were checked on 2026-10-06.

## System Shape

```text
React workspace (client/src/App.tsx, 242 lines)
  -> client/src/services/api.ts (demo headers, /api/tickets)
  -> Express: helmet, CORS, request context, logging, JSON, object-body guard (server/src/app.ts)
  -> routes/routes.ts -> controllers/controller.ts
  -> services/service.ts: validation, role checks, list clamping
  -> models/model.ts: Knex transactions + audit/activity writes
  -> PostgreSQL: tickets, comments, saved_views, audit_log, activity_events
```

`/ready` pings the database (`server/src/app.ts:41`); the router is mounted at `/api/tickets` (`app.ts:53`).

## Data model

| Table | Defined in | Notes |
|---|---|---|
| `teams` | `001_init.ts:4` | the only "org" table |
| `tickets` | `001_init.ts:10`, extended by `002_enterprise_features.ts` and `003_archive_status.ts` | `team_id`, `title`, `status` (DB default `'active'`, which is not an allowed ticket status), `priority`, `owner`, `metadata` jsonb, `due_at`, `risk_level`, `version`, `archived_at`, `deleted_at`, `status_before_archive` |
| `comments` | `002_enterprise_features.ts:14` | `ticket_id`, `author`, `body`, `is_internal` |
| `saved_views` | `002_enterprise_features.ts:27` | `team_id`, `filters` jsonb |
| `audit_log` | `002_enterprise_features.ts:40` | `ticket_id`, `actor`, `action`, `before`/`after`, `request_id` |

Statuses are `open, pending, escalated, resolved, archived` and priorities `low, medium, high, urgent` (`server/src/services/service.ts:4-11`). New tickets default to `open` (`:137`) and `team_id` 1 (`:142`). SLA appears only as a number inside metadata (`slaHours` in `server/db/seeds/001_seed.ts` and in the client form's default metadata, `client/src/App.tsx:29`); no server code reads it.

## Identity

Same as the template: `x-demo-user` and `x-demo-role` headers, role defaulting to `operator` (`server/src/middleware/requestContext.ts:22-23`); `requireOperator` (`service.ts:35`) accepts operator, admin or manager and returns 400 otherwise.

## Request trace: updating a ticket

`saveRecord` (`client/src/App.tsx:100`) → `updateRecord` (`client/src/services/api.ts:59`) → `PUT /api/tickets/:id` (`routes.ts:17`) → `service.update` (`service.ts:163`: role check, existence check, `sanitizePayload` at `:60`) → `model.updateRecord` (`server/src/models/model.ts:75`: row lock at `:81`, `version + 1` at `:89`, activity and audit rows in the same transaction).

## Findings specific to this project (verified)

1. **Every comment from the UI is internal, and nothing filters internal comments.** The client's comment form always passes `isInternal = true` (`App.tsx:134`), and `listComments` returns every comment for the ticket with no `is_internal` filter (`model.ts:233`). The flag exists, but no read path honors it; a customer-facing view would leak every note.
2. **"Sort by priority" is alphabetical.** `priority` is a string column and `listRecords` orders by it directly (`model.ts:38`), so descending order is `urgent, medium, low, high`: `high` sorts below `low`.
3. **The bulk cap counts raw ids here.** `bulkStatus` rejects more than 100 ids before de-duplicating, with the misleading message "ids must be a non-empty array." (`service.ts:199-204`); Project 16 caps the distinct set and has a fifth test for it, which this project's `test/crud.test.ts` (four tests) does not.
4. **Template issues apply unchanged:** raw error messages returned on 500 (`server/src/middleware/errorMiddleware.ts:20`), `version` never checked, and `team_id` stamped but never used to filter reads (see Project 16's findings).

`restoreRecord` passes `{ archived_at: null, status: "active" }` (`model.ts:154`), but `lifecycleUpdate` replaces those values for a restore (`:188` restores `status_before_archive`, falling back to `open`), so the `"active"` literal is dead code.

## Debugging scenario

Symptom: an agent sorts the queue by priority (descending) and a `high` ticket appears below `low` ones. Path: `normalizeListQuery` allows `sort=priority` (`service.ts:43`), and `model.ts:38` emits `ORDER BY priority DESC, id DESC` on a text column. Confirm with `SELECT title, priority FROM tickets WHERE deleted_at IS NULL ORDER BY priority DESC;`. A fix maps priority to a rank (`CASE priority WHEN 'urgent' THEN 4 ... END`) or stores an integer.

## Exercise ladder

1. **Goal:** confirm what "SLA" means in this codebase today. **Check:** `grep -rni "sla" server/src client/src` finds only `"slaHours": 4` in the client form's default metadata (`App.tsx:29`); the seed also stores `slaHours` in metadata, and nothing computes a deadline from it.
2. **Goal:** honor `is_internal` on reads. **Check:** `listComments` accepts an audience and excludes internal comments for it; a test creates one public and one internal comment and asserts the customer read returns one. Run locally (needs Postgres): `npm test` with `ASTRA_TEST_DATABASE_URL` set to an `astra_test_*` database.
3. **Goal:** make priority sort meaningful. **Check:** sorting by priority descending returns `urgent, high, medium, low`, with a test.
4. **Goal:** add first-response and resolve deadlines. **Check:** a migration adds `first_response_due_at` and `resolve_due_at`, set on create from a priority table, and the dashboard reports a breach count computed from them.

## Scale Risks To Discuss

- Audit and activity tables need retention and index strategy.
- Saved views need visibility and ownership rules.
- Bulk operations need rate limiting and confirmation UX.
- Demo request headers must become real authentication before production.

See `docs/journal.md` for the teaching narrative behind these choices.
