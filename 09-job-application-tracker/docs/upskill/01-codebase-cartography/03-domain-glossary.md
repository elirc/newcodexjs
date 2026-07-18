# Domain Glossary

Project: **Job Application Tracker** (`09-job-application-tracker`)

## application

Meaning in this project: a core domain term used to reason about pipeline state, notes, documents, reminders, dashboard KPIs.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving application.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## stage

Meaning in this project: a core domain term used to reason about pipeline state, notes, documents, reminders, dashboard KPIs.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving stage.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## stage history

Meaning in this project: a core domain term used to reason about pipeline state, notes, documents, reminders, dashboard KPIs.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving stage history.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## document

Meaning in this project: a core domain term used to reason about pipeline state, notes, documents, reminders, dashboard KPIs.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving document.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## reminder

Meaning in this project: a core domain term used to reason about pipeline state, notes, documents, reminders, dashboard KPIs.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/service.ts` for rules involving reminder.
- `server/db/migrations/001_init.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## Verification Notes

- Generated from inspected files in `09-job-application-tracker`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
