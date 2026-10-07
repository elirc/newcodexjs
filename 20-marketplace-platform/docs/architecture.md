# Multi-Vendor Marketplace Platform Architecture

> **Shared origin and honesty note.** This app was generated from the same template as Projects 16-20 ([`scripts/generate-projects-16-20.mjs`](../../scripts/generate-projects-16-20.mjs), then [`scripts/enhance-projects-16-20.mjs`](../../scripts/enhance-projects-16-20.mjs)). Routes and request-context middleware are byte-identical to Project 16's, and the service and model differ in names, the status/priority lists and a few lines. The generator's config lists `product_variants`, `orders`, `payments` and `reviews`, but only `vendors` (the first entry) became a table: there are no orders, payments, carts or ledgers here. Price and inventory live in an untyped `metadata` JSON object. This document covers what is specific to this codebase and refers to [`16-team-project-management/docs/architecture.md`](../../16-team-project-management/docs/architecture.md) for the full template walkthrough; Project 13 is the series' actual checkout implementation. Line numbers were checked on 2026-10-06.

## System Shape

```text
React workspace (client/src/App.tsx, 242 lines)
  -> client/src/services/api.ts (demo headers, /api/listings)
  -> Express: helmet, CORS, request context, logging, JSON, object-body guard (server/src/app.ts)
  -> routes/routes.ts -> controllers/controller.ts
  -> services/service.ts: validation, role checks, list clamping
  -> models/model.ts: Knex transactions + audit/activity writes
  -> PostgreSQL: vendors, listings, comments, saved_views, audit_log, activity_events
```

`/ready` pings the database (`server/src/app.ts:41`); the router is mounted at `/api/listings` (`app.ts:53`).

## Data model

| Table | Defined in | Notes |
|---|---|---|
| `vendors` | `001_init.ts:4` | `name`; the seed creates one, "Demo vendor" |
| `listings` | `001_init.ts:10`, extended by `002_enterprise_features.ts` and `003_archive_status.ts` | `vendor_id` FK, `title`, `status` (DB default `'active'`, a valid listing status), `priority`, `owner` (free-text vendor name), `metadata` jsonb (`price`, `inventory`, `category`), `due_at`, `risk_level`, `version`, `archived_at`, `deleted_at`, `status_before_archive` |
| `comments` | `002_enterprise_features.ts:14` | `listing_id`, `author`, `body`, `is_internal` |
| `saved_views` | `002_enterprise_features.ts:27` | `vendor_id`, `filters` jsonb |
| `audit_log` | `002_enterprise_features.ts:40` | `listing_id`, `actor`, `action`, `before`/`after`, `request_id` |

Statuses are `draft, active, flagged, paused, archived` and priorities `low, medium, high, featured` (`server/src/services/service.ts:4-5`); new listings default to `draft` (`:131`) and `vendor_id` 1 (`:136`).

## Identity

Template behavior: `x-demo-user` / `x-demo-role` headers, role defaulting to `operator` (`server/src/middleware/requestContext.ts:22-23`); `requireOperator` (`service.ts:29`) returns 400 for other roles. There is no vendor or buyer identity: the request context never resolves to a vendor.

## Request trace: editing a listing's price

`saveRecord` (`client/src/App.tsx:100`) sends the whole form, including `metadata` → `updateRecord` (`client/src/services/api.ts:59`) → `PUT /api/listings/:id` (`routes.ts:17`) → `service.update` (`service.ts:157`: role check, existence check, `sanitizePayload` at `:54`, which accepts `metadata` as any JSON object up to 20,000 characters and `vendor_id` as any positive integer) → `model.updateRecord` (`server/src/models/model.ts:75`: row lock at `:81`, `...payload` written as-is at `:86-91`, then activity and audit rows).

## Findings specific to this project (verified)

1. **Money is untyped JSON, replaced wholesale.** Price and inventory exist only as `metadata.price` / `metadata.inventory` (seed and `App.tsx:20-32`). `sanitizePayload` checks only that `metadata` is an object (`service.ts:101-110`), so a negative or string price is accepted, and because `updateRecord` writes `metadata` whole (`model.ts:86-91`), an API edit that sends `{ metadata: { category: "office" } }` silently deletes the price. Listings cannot be sorted or filtered by price (`allowedSorts`, `service.ts:6`).
2. **Any caller can move a listing to another vendor.** `vendor_id` is in the editable allow-list (`service.ts:54-64`) and is checked only for being a positive integer (`:122-128`); reads never filter by vendor (`model.ts:23-56`). Tenancy between competing vendors does not exist yet.
3. **Vendor names disagree with the vendor FK.** The seed gives three listings different `owner` names ("Northwind Goods", "Contoso Supply", "Fabrikam Studio") but the same `vendor_id`, the single "Demo vendor" (`server/db/seeds/001_seed.ts`). `owner` is display text, not a relationship.
4. **"Featured" sorts last and the bulk cap counts raw ids.** `priority` is text sorted directly (`model.ts:38`), so descending order is `medium, low, high, featured`; `bulkStatus` rejects more than 100 raw ids with the message "ids must be a non-empty array." (`service.ts:193-198`). Template issues (raw 500 messages at `server/src/middleware/errorMiddleware.ts:20`, unchecked `version`) also apply.

## Debugging scenario

Symptom: after an operator edits a listing's title through a script, its price disappears from the UI. Path: check the audit row: `SELECT before->'metadata', after->'metadata' FROM audit_log WHERE listing_id = <id> ORDER BY id DESC LIMIT 1;`. If `after.metadata` lacks `price`, the request sent a partial `metadata` object, and `updateRecord` replaced the whole column (`model.ts:86-91`). The bundled UI avoids this only because `saveRecord` resends the full form. A safe fix merges JSON (`metadata || ?::jsonb`) or promotes price to a typed column.

## Exercise ladder

1. **Goal:** list what the marketplace does not have yet. **Check:** `grep -rn "createTable" server/db/migrations` shows `vendors`, `listings`, `activity_events`, `comments`, `saved_views` and `audit_log` only.
2. **Goal:** make price a real column. **Check:** a migration adds `price_cents integer not null check (price_cents >= 0)` backfilled from `metadata->>'price'`, the service validates it, and `allowedSorts` includes it. Run locally (needs Postgres): `npm test` with `ASTRA_TEST_DATABASE_URL` set to an `astra_test_*` database.
3. **Goal:** stop vendor reassignment. **Check:** `vendor_id` is removed from the update allow-list (or limited to operators), and a test editing `vendor_id` as a vendor expects 403 with the row unchanged.
4. **Goal:** scope reads by vendor. **Check:** the request context carries a vendor id, `listRecords` filters by it for vendor callers, and a test proves vendor 2 cannot see vendor 1's `draft` listing.

## Scale Risks To Discuss

- Audit and activity tables need retention and index strategy.
- Saved views need visibility and ownership rules.
- Bulk operations need rate limiting and confirmation UX.
- Demo request headers must become real authentication before production.

See `docs/journal.md` for the teaching narrative behind these choices.
