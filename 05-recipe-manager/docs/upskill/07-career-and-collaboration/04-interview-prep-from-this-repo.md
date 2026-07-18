# Interview Prep From This Repo

Project: **Recipe Manager** (`05-recipe-manager`)

This file is the interview-prep addendum requested for full-stack JS roles. Use Recipe Manager as your concrete story bank.

## Language And Runtime Questions

1. How does async/await move a request through this app?
   - Junior: identifies `client/src/services/api.ts:4` or `server/src/controllers/recipeController.ts:6` as async.
   - Mid-level: explains promise failure and error propagation.
   - Senior: discusses latency, parallelism, timeout, and observability.
2. What is the difference between browser state and server state here?
   - Junior: points to `client/src/App.tsx:19`.
   - Mid-level: explains refresh and stale data.
   - Senior: discusses cache invalidation and contract boundaries.

## React Questions

- Where should form state live for this app?
- What would make a component rerender unnecessarily?
- How would you add an optimistic update safely?

Use anchors: `client/src/App.tsx:19`, `client/src/services/api.ts:4`.

## Node/Express Questions

- Why keep controllers thin?
- How does middleware order affect behavior?
- How are errors translated?

Use anchors: `server/src/app.ts:3`, `server/src/routes/recipeRoutes.ts:1`, `server/src/controllers/recipeController.ts:6`, `server/src/middleware/errorHandler.ts:2`.

## Database Questions

- What does the migration commit the team to?
- Where would you add an index?
- When do you need a transaction?

Use anchors: `server/db/migrations/001_initial_schema.ts:5`, `server/src/models/recipeModel.ts:2`.

## System Design Prompts

1. Scale auth, protected recipes, public/private recipes, favorites to 10x records.
2. Add multi-user ownership and authorization.
3. Add audit logging for destructive actions.
4. Add pagination and filtering without breaking clients.
5. Add observability for slow requests.

## Debugging Questions

- The UI says save succeeded, but the record does not appear. Trace from `client/src/App.tsx:19` to `server/src/models/recipeModel.ts:2`.
- A migration works locally but fails in CI. What do you inspect?
- A user can access another user's resource. Where should the fix live?

## Code Review Questions

Review a PR that moves validation from `server/src/services/recipeService.ts:17` into `client/src/App.tsx:19`. Strong answer: UI validation improves UX, but server validation protects the system boundary.

## Behavioral Prompts

- Tell me about a time you reduced blast radius. Use a good-first ticket from this repo.
- Tell me about a time you disagreed in review. Use the PR/RFC guide.
- Tell me about a time you debugged across layers. Use the trace table.

## Self-Grading

- Weak: talks generally about React/Node without file anchors.
- Solid: names files and traces data shape.
- Strong: explains invariant, risk, testing strategy, and alternative design.

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
