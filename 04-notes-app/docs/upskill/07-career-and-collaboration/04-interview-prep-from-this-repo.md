# Interview Prep From This Repo

Project: **Notes App** (`04-notes-app`)

This file is the interview-prep addendum requested for full-stack JS roles. Use Notes App as your concrete story bank.

## Language And Runtime Questions

1. How does async/await move a request through this app?
   - Junior: identifies `client/src/services/api.js:4` or `server/src/controllers/controller.js:4` as async.
   - Mid-level: explains promise failure and error propagation.
   - Senior: discusses latency, parallelism, timeout, and observability.
2. What is the difference between browser state and server state here?
   - Junior: points to `client/src/App.jsx:18`.
   - Mid-level: explains refresh and stale data.
   - Senior: discusses cache invalidation and contract boundaries.

## React Questions

- Where should form state live for this app?
- What would make a component rerender unnecessarily?
- How would you add an optimistic update safely?

Use anchors: `client/src/App.jsx:18`, `client/src/services/api.js:4`.

## Node/Express Questions

- Why keep controllers thin?
- How does middleware order affect behavior?
- How are errors translated?

Use anchors: `server/src/app.js:2`, `server/src/routes/routes.js:3`, `server/src/controllers/controller.js:4`, `server/src/middleware/errorMiddleware.js:1`.

## Database Questions

- What does the migration commit the team to?
- Where would you add an index?
- When do you need a transaction?

Use anchors: `server/db/migrations/001_init.js:2`, `server/src/models/model.js:1`.

## System Design Prompts

1. Scale markdown notes, folders, tags, searchable knowledge capture to 10x records.
2. Add multi-user ownership and authorization.
3. Add audit logging for destructive actions.
4. Add pagination and filtering without breaking clients.
5. Add observability for slow requests.

## Debugging Questions

- The UI says save succeeded, but the record does not appear. Trace from `client/src/App.jsx:18` to `server/src/models/model.js:1`.
- A migration works locally but fails in CI. What do you inspect?
- A user can access another user's resource. Where should the fix live?

## Code Review Questions

Review a PR that moves validation from `server/src/services/service.js:3` into `client/src/App.jsx:18`. Strong answer: UI validation improves UX, but server validation protects the system boundary.

## Behavioral Prompts

- Tell me about a time you reduced blast radius. Use a good-first ticket from this repo.
- Tell me about a time you disagreed in review. Use the PR/RFC guide.
- Tell me about a time you debugged across layers. Use the trace table.

## Self-Grading

- Weak: talks generally about React/Node without file anchors.
- Solid: names files and traces data shape.
- Strong: explains invariant, risk, testing strategy, and alternative design.

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
