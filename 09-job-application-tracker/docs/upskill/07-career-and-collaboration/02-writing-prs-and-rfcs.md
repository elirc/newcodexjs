# Writing PRs And RFCs

Project: **Job Application Tracker** (`09-job-application-tracker`)

## PR Template

- What changed:
- Why:
- How tested:
- Screenshots/logs:
- Risks:
- Follow-ups:

## Commit Message Shape

`area: concise behavior change`

Example: `application: add validation for empty title`.

## RFC Template

- Problem
- Current behavior with anchors: `client/src/App.tsx:17`, `server/src/services/service.ts:5`, `server/src/models/model.ts:1`
- Options considered
- Proposed design
- Migration plan
- Test plan
- Rollout/rollback
- Open questions

## Verification Notes

- Generated from inspected files in `09-job-application-tracker`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
