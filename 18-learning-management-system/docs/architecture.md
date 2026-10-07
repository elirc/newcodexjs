# Learning Management System Architecture

> **Shared origin and honesty note.** This app was generated from the same template as Projects 16-20 ([`scripts/generate-projects-16-20.mjs`](../../scripts/generate-projects-16-20.mjs), then [`scripts/enhance-projects-16-20.mjs`](../../scripts/enhance-projects-16-20.mjs)). Routes and request-context middleware are byte-identical to Project 16's; the service and model differ in names, the status/priority lists and a few lines. The generator's config for this project lists `modules`, `lessons`, `enrollments` and `quiz_attempts`, but only `schools` (the first entry) became a table, so there is no course structure, enrollment or progress code. This document therefore covers what is specific to this codebase and refers to [`16-team-project-management/docs/architecture.md`](../../16-team-project-management/docs/architecture.md) for the full template walkthrough. Line numbers were checked on 2026-10-06.

## System Shape

```text
React workspace (client/src/App.tsx, 242 lines)
  -> client/src/services/api.ts (demo headers, /api/courses)
  -> Express: helmet, CORS, request context, logging, JSON, object-body guard (server/src/app.ts)
  -> routes/routes.ts -> controllers/controller.ts
  -> services/service.ts: validation, role checks, list clamping
  -> models/model.ts: Knex transactions + audit/activity writes
  -> PostgreSQL: courses, comments, saved_views, audit_log, activity_events
```

`/ready` pings the database (`server/src/app.ts:41`); the router is mounted at `/api/courses` (`app.ts:53`).

## Data model

| Table | Defined in | Notes |
|---|---|---|
| `schools` | `001_init.ts:4` | the only "org" table |
| `courses` | `001_init.ts:10`, extended by `002_enterprise_features.ts` and `003_archive_status.ts` | `school_id`, `title`, `status` (DB default `'active'`, which is not a course status), `priority`, `owner` (instructor name as text), `metadata` jsonb, `due_at`, `risk_level`, `version`, `archived_at`, `deleted_at`, `status_before_archive` |
| `comments` | `002_enterprise_features.ts:14` | `course_id`, `author`, `body`, `is_internal` |
| `saved_views` | `002_enterprise_features.ts:27` | `school_id`, `filters` jsonb |
| `audit_log` | `002_enterprise_features.ts:40` | `course_id`, `actor`, `action`, `before`/`after`, `request_id` |

Statuses are `draft, review, published, retired, archived` and priorities `low, medium, high, featured` (`server/src/services/service.ts:4-5`); new courses default to `draft` (`:131`) and `school_id` 1 (`:136`). Lesson counts and levels exist only inside `metadata` (for example `{ lessons: 18, level: "intermediate" }` in `server/db/seeds/001_seed.ts`).

## Identity

Template behavior: `x-demo-user` / `x-demo-role` headers with the role defaulting to `operator` (`server/src/middleware/requestContext.ts:22-23`); `requireOperator` (`service.ts:29`) returns 400 for other roles. There is no student or instructor identity.

## Request trace: publishing courses in bulk

`runBulkStatus` (`client/src/App.tsx:125`) → `bulkStatus` in `client/src/services/api.ts` → `POST /api/courses/bulk/status` (`routes.ts:14`) → `service.bulkStatus` (`service.ts:188`: role check, at most 100 raw ids, de-duplicate, status must be in the allow-list) → `model.bulkStatus` (`server/src/models/model.ts:99`: locks all rows in id order at `:108`, 404 for the whole batch if any id is missing, per-row update with `version + 1` at `:124`, plus activity and audit rows in one transaction).

## Findings specific to this project (verified)

1. **No publication workflow.** Any status may follow any other: `sanitizePayload` and `bulkStatus` only check membership in the allow-list (`service.ts:4`, `:188-197`). A `draft` course can go straight to `published`, singly or in bulk, without passing `review`, and nothing records who approved it beyond the generic audit row.
2. **"Featured" sorts last.** `priority` is text and `listRecords` orders by it directly (`model.ts:38`), so `sort=priority&order=desc` yields `medium, low, high, featured`: the merchandising flag meant to be on top lands at the bottom.
3. **The bulk cap counts raw ids.** More than 100 ids are rejected before de-duplication, with the message "ids must be a non-empty array." (`service.ts:193-198`); Project 16 caps distinct ids and tests it, while this project's `test/crud.test.ts` has four tests and no cap test.
4. **Template issues apply unchanged:** raw 500 messages (`server/src/middleware/errorMiddleware.ts:20`), `version` never checked, `school_id` stamped but not used to filter reads.

`restoreRecord` passes `status: "active"` (`model.ts:154`), which is not a course status; it is dead code because `lifecycleUpdate` replaces it with `status_before_archive || "draft"` (`:188`).

## Debugging scenario

Symptom: a course archived from `published` comes back as `draft` after restore. Path: restore reads `status_before_archive` (`model.ts:188`), which `statusFields` (`:325`) saves only when the status changes to `archived` through the API. Rows inserted directly as `archived` (by SQL or an older seed) have no saved status and fall back to `draft`. Check `SELECT id, status, archived_at, status_before_archive FROM courses WHERE id = <id>;` and the matching `audit_log` rows.

## Exercise ladder

1. **Goal:** confirm the missing structure. **Check:** `grep -rn "createTable" server/db/migrations` lists `schools`, `courses`, `activity_events`, `comments`, `saved_views` and `audit_log` only.
2. **Goal:** enforce `draft → review → published → retired`. **Check:** a transition map in the service rejects `draft → published` with 409 on both the single and bulk paths; a test covers each. Run locally (needs Postgres): `npm test` with `ASTRA_TEST_DATABASE_URL` set to an `astra_test_*` database.
3. **Goal:** make "featured first" true. **Check:** priority sorting uses an explicit rank, and a test asserts `featured` is first in descending order.
4. **Goal:** add modules and lessons. **Check:** a migration creates both with a `position` column and FKs to `courses`, and `GET /api/courses/:id/outline` returns them ordered in two queries.

## Scale Risks To Discuss

- Audit and activity tables need retention and index strategy.
- Saved views need visibility and ownership rules.
- Bulk operations need rate limiting and confirmation UX.
- Demo request headers must become real authentication before production.

See `docs/journal.md` for the teaching narrative behind these choices.
