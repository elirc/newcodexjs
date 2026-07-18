# Observability And Operations

Project: **Contact Book / Address Manager** (`02-contact-book`)

## What Exists

- Health route or server startup around `server/src/app.js:1` and `server/src/server.js:9`.
- Error envelope around `server/src/middleware/errors.js:3`.
- Dev logging if middleware such as Morgan is mounted in `server/src/app.js:1`.

## How Would I Know This Broke?

| Flow | Signal | Missing Signal To Consider |
| --- | --- | --- |
| API unavailable | health check fails | uptime alert |
| Validation bug | 400/500 responses | structured error count |
| Slow DB query | delayed API response | query duration logs |
| UI contract drift | browser console/network error | frontend error boundary |

## Verification Notes

- Generated from inspected files in `02-contact-book`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/contactRoutes.js`, `server/src/services/contactService.js`, `server/src/models/contactModel.js`, `server/db/migrations/202607030201_create_contacts_tags.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
