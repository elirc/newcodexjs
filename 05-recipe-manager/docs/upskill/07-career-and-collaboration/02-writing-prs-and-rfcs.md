# Writing PRs And RFCs

Project: **Recipe Manager** (`05-recipe-manager`)

## PR Template

- What changed:
- Why:
- How tested:
- Screenshots/logs:
- Risks:
- Follow-ups:

## Commit Message Shape

`area: concise behavior change`

Example: `user: add validation for empty title`.

## RFC Template

- Problem
- Current behavior with anchors: `client/src/App.tsx:19`, `server/src/services/recipeService.ts:17`, `server/src/models/recipeModel.ts:2`
- Options considered
- Proposed design
- Migration plan
- Test plan
- Rollout/rollback
- Open questions

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
