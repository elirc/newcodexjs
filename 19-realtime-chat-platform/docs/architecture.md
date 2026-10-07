# Real-Time Chat Platform Architecture

> **Shared origin and honesty note.** Despite the name, this app has no real-time transport and no messages. It was generated from the same template as Projects 16-20 ([`scripts/generate-projects-16-20.mjs`](../../scripts/generate-projects-16-20.mjs), then [`scripts/enhance-projects-16-20.mjs`](../../scripts/enhance-projects-16-20.mjs)): routes and request-context middleware are byte-identical to Project 16's, and the service and model differ in names, the status list and a few lines. The generator's config lists `conversation_members`, `messages` and `message_events`, but only `workspaces` (the first entry) became a table. No WebSocket or socket library appears in any `package.json`, and the client does not poll. What exists is an operator console over `conversations` records. This document covers what is specific to this codebase and refers to [`16-team-project-management/docs/architecture.md`](../../16-team-project-management/docs/architecture.md) for the full template walkthrough; Project 12 is the series' actual chat implementation. Line numbers were checked on 2026-10-06.

## System Shape

```text
React workspace (client/src/App.tsx, 242 lines)
  -> client/src/services/api.ts (demo headers, /api/conversations)
  -> Express: helmet, CORS, request context, logging, JSON, object-body guard (server/src/app.ts)
  -> routes/routes.ts -> controllers/controller.ts
  -> services/service.ts: validation, role checks, list clamping
  -> models/model.ts: Knex transactions + audit/activity writes
  -> PostgreSQL: conversations, comments, saved_views, audit_log, activity_events
```

`/ready` pings the database (`server/src/app.ts:41`); the router is mounted at `/api/conversations` (`app.ts:53`).

## Data model

| Table | Defined in | Notes |
|---|---|---|
| `workspaces` | `001_init.ts:4` | same org table name as Project 16 |
| `conversations` | `001_init.ts:10`, extended by `002_enterprise_features.ts` and `003_archive_status.ts` | `workspace_id`, `title`, `status` (DB default `'active'`, which here *is* a valid status), `priority`, `owner`, `metadata` jsonb (seeded with `unread` and `mode`), `due_at`, `risk_level`, `version`, `archived_at`, `deleted_at`, `status_before_archive` |
| `comments` | `002_enterprise_features.ts:14` | `conversation_id`, `author`, `body`, `is_internal` (used as moderation notes) |
| `saved_views` | `002_enterprise_features.ts:27` | `workspace_id`, `filters` jsonb |
| `audit_log` | `002_enterprise_features.ts:40` | `conversation_id`, `actor`, `action`, `before`/`after`, `request_id` |

Statuses are `active, muted, incident, archived` (`server/src/services/service.ts:4`); priorities are Project 16's `low, medium, high, critical` (`:5`). New conversations default to `active` (`:131`) and `workspace_id` 1 (`:136`). `muted` and `incident` are labels only: nothing else in the code reads them.

## Identity

Template behavior: `x-demo-user` / `x-demo-role` headers, role defaulting to `operator` (`server/src/middleware/requestContext.ts:22-23`); `requireOperator` (`service.ts:29`) returns 400 for other roles. There are no member identities.

## Request trace: muting a conversation in bulk

`runBulkStatus` (`client/src/App.tsx:125`) → `POST /api/conversations/bulk/status` (`routes.ts:14`) → `service.bulkStatus` (`service.ts:188`: role check, at most 100 raw ids, de-duplicate, status allow-list) → `model.bulkStatus` (`server/src/models/model.ts:99`: row locks in id order at `:108`, all-or-nothing 404 on missing ids, `version + 1` at `:124`, activity and audit rows in one transaction).

## Findings specific to this project (verified)

1. **The seed creates an "archived" conversation that the lifecycle cannot see.** `server/db/seeds/001_seed.ts` inserts "Incident Archive" with `status: "archived"` but no `archived_at`. The default list hides only rows with `archived_at` set (`model.ts:26`), so it appears in the active list; restore is a no-op because `lifecycleUpdate` returns early when `archived_at` is null (`model.ts:183`). Archiving it through the API sets `archived_at` but keeps `status_before_archive` null, because `statusFields` preserves the old value when the status is already `archived` (`:327-337`), so a later restore falls back to `active` (`:188`).
2. **Moderation states have no effect.** `muted` and `incident` change a string; there is no message flow to restrict. The labs in `docs/FABLE.md` that "make muted mean something" start from zero.
3. **The bulk cap counts raw ids** and reports "ids must be a non-empty array." when more than 100 are sent (`service.ts:193-198`), unlike Project 16, which caps distinct ids and tests it; this project's `test/crud.test.ts` has four tests and no cap test.
4. **Template issues apply unchanged:** raw 500 messages (`server/src/middleware/errorMiddleware.ts:20`), `version` never checked, `workspace_id` not used to filter reads, and `priority` sorted as text (`model.ts:38`).

## Debugging scenario

Symptom: after `npm run seed`, "Incident Archive" shows in the default list with status `archived`, and the Restore button does nothing. Path: run `SELECT id, title, status, archived_at, status_before_archive FROM conversations;` and see `archived_at` is null for that row. The list filter (`model.ts:26`) uses `archived_at`, not `status`, and restore (`model.ts:154` → `lifecycleUpdate`) only acts on rows with `archived_at`. Fix the data (`UPDATE conversations SET archived_at = now(), status_before_archive = 'active' WHERE title = 'Incident Archive';`) or seed through the same lifecycle rules the API uses.

## Exercise ladder

1. **Goal:** confirm there is no transport. **Check:** `grep -rn "socket\|\"ws\"" package.json server/package.json client/package.json` finds nothing, and `grep -n "setInterval\|refetchInterval" client/src/App.tsx` finds nothing.
2. **Goal:** make the seed consistent with the lifecycle. **Check:** after re-seeding, every row with `status = 'archived'` has `archived_at` set, and a test asserts the default list excludes it.
3. **Goal:** add messages. **Check:** a migration adds `messages (conversation_id, author, body, created_at)`, and posting to a `muted` conversation returns 409 while an `active` one returns 201. Run locally (needs Postgres): `npm test` with `ASTRA_TEST_DATABASE_URL` set to an `astra_test_*` database.
4. **Goal:** push new messages to clients. **Check:** a WebSocket broadcast happens only after the insert transaction commits, and the client backfills with an `after` cursor on reconnect (Project 12's `listMessagesAfter` pattern).

## Scale Risks To Discuss

- Audit and activity tables need retention and index strategy.
- Saved views need visibility and ownership rules.
- Bulk operations need rate limiting and confirmation UX.
- Demo request headers must become real authentication before production.

See `docs/journal.md` for the teaching narrative behind these choices.
