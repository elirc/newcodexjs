# Side Effects, Async, And Reliability

Project: **Blog Platform** (`07-blog-platform`)

Side effects in Tier 1 are intentionally limited, but the project may include email, uploads, metadata fetches, CSV export, or reporting.

## Reliability Concepts

- Idempotency: retrying should not duplicate records.
- Timeout: external calls should not hang request workers forever.
- Backpressure: expensive flows should avoid unbounded work.
- Visibility: failures should be logged and returned through the error envelope.

## Inspect

- API side effects near `server/src/services/service.ts:5`.
- Persistence writes near `server/src/models/model.ts:1`.
- Error translation near `server/src/middleware/errorMiddleware.ts:2`.

## Drill

Pick one write flow. Ask: if the database write succeeds but the UI refresh fails, what state does the user see?

## Verification Notes

- Generated from inspected files in `07-blog-platform`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
