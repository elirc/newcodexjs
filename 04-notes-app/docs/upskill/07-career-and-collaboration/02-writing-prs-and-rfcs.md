# Writing PRs And RFCs

Project: **Notes App** (`04-notes-app`)

## PR Template

- What changed:
- Why:
- How tested:
- Screenshots/logs:
- Risks:
- Follow-ups:

## Commit Message Shape

`area: concise behavior change`

Example: `note: add validation for empty title`.

## RFC Template

- Problem
- Current behavior with anchors: `client/src/App.jsx:18`, `server/src/services/service.js:3`, `server/src/models/model.js:1`
- Options considered
- Proposed design
- Migration plan
- Test plan
- Rollout/rollback
- Open questions

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
