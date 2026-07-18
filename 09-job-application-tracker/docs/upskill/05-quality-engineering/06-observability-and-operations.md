# Observability And Operations

Project: **Job Application Tracker** (`09-job-application-tracker`)

## What Exists

- Health route or server startup around `server/src/app.ts:2` and `server/src/server.ts:5`.
- Error envelope around `server/src/middleware/errorMiddleware.ts:2`.
- Dev logging if middleware such as Morgan is mounted in `server/src/app.ts:2`.

## How Would I Know This Broke?

| Flow | Signal | Missing Signal To Consider |
| --- | --- | --- |
| API unavailable | health check fails | uptime alert |
| Validation bug | 400/500 responses | structured error count |
| Slow DB query | delayed API response | query duration logs |
| UI contract drift | browser console/network error | frontend error boundary |

## Verification Notes

- Generated from inspected files in `09-job-application-tracker`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
