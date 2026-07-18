# Observability And Operations

Project: **Notes App** (`04-notes-app`)

## What Exists

- Health route or server startup around `server/src/app.js:2` and `server/src/server.js:4`.
- Error envelope around `server/src/middleware/errorMiddleware.js:1`.
- Dev logging if middleware such as Morgan is mounted in `server/src/app.js:2`.

## How Would I Know This Broke?

| Flow | Signal | Missing Signal To Consider |
| --- | --- | --- |
| API unavailable | health check fails | uptime alert |
| Validation bug | 400/500 responses | structured error count |
| Slow DB query | delayed API response | query duration logs |
| UI contract drift | browser console/network error | frontend error boundary |

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
