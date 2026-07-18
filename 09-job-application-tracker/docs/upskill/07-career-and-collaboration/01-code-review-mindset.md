# Code Review Mindset

Project: **Job Application Tracker** (`09-job-application-tracker`)

Review layers:

1. Does it work?
2. Is it correct for edge cases?
3. Will it stay correct?
4. Does it fit the codebase boundaries?
5. Is it kind to future maintainers?

Repo-specific checklist:
- UI behavior near `client/src/App.tsx:17`.
- HTTP contract near `client/src/services/api.ts:4` and `server/src/routes/routes.ts:4`.
- Business rules near `server/src/services/service.ts:5`.
- Query shape near `server/src/models/model.ts:1`.
- Schema changes near `server/db/migrations/001_init.ts:4`.

Good review language:
> Could we move this rule into the service so every API caller gets the same protection?

## Verification Notes

- Generated from inspected files in `09-job-application-tracker`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
