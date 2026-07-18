# Maintainer Communication

Project: **Job Application Tracker** (`09-job-application-tracker`)

## Ask For Help Without Outsourcing Thinking

Good question shape:
- What I tried
- What I expected
- What happened
- Files inspected
- Minimal reproduction
- My current hypothesis

## Templates

Bug report: include command, environment, reproduction, expected result, actual result.

Feature proposal: explain user value, existing pattern, blast radius, test plan.

Responding to review: acknowledge, state change, mention verification.

Respectful disagreement: name the tradeoff and propose a small experiment.

## Verification Notes

- Generated from inspected files in `09-job-application-tracker`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
