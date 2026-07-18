# Maintainer Communication

Project: **Recipe Manager** (`05-recipe-manager`)

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

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
