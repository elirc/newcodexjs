# Side Effects, Async, And Reliability

Project: **Notes App** (`04-notes-app`)

Side effects in Tier 1 are intentionally limited, but the project may include email, uploads, metadata fetches, CSV export, or reporting.

## Reliability Concepts

- Idempotency: retrying should not duplicate records.
- Timeout: external calls should not hang request workers forever.
- Backpressure: expensive flows should avoid unbounded work.
- Visibility: failures should be logged and returned through the error envelope.

## Inspect

- API side effects near `server/src/services/service.js:3`.
- Persistence writes near `server/src/models/model.js:1`.
- Error translation near `server/src/middleware/errorMiddleware.js:1`.

## Drill

Pick one write flow. Ask: if the database write succeeds but the UI refresh fails, what state does the user see?

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
