# Trace Tables

Project: **Contact Book / Address Manager** (`02-contact-book`)

## UI To API Trace

| Step | File | Value Shape | Owner | Transformation | Risk |
| --- | --- | --- | --- | --- | --- |
| User input | `client/src/App.jsx:125` | form state | UI | event -> state | stale or invalid value |
| API call | `client/src/services/api.js:4` | JSON payload | client API | state -> HTTP | contract drift |
| Route | `server/src/routes/contactRoutes.js:5` | request | transport | method/path -> handler | wrong route |
| Service | `server/src/services/contactService.js:10` | domain payload | domain | validate/normalize | missing invariant |
| Model | `server/src/models/contactModel.js:1` | row/query | persistence | payload -> SQL | unbounded or unsafe query |

## Error Trace

| Step | File | Failure | Translation |
| --- | --- | --- | --- |
| Service rejects | `server/src/services/contactService.js:10` | validation/business error | throw typed error if present |
| Middleware | `server/src/middleware/errors.js:3` | exception | standard error envelope |
| Client | `client/src/services/api.js:4` | HTTP failure | user-facing error state |

## Verification Notes

- Generated from inspected files in `02-contact-book`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/contactRoutes.js`, `server/src/services/contactService.js`, `server/src/models/contactModel.js`, `server/db/migrations/202607030201_create_contacts_tags.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
