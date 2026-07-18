# Writing PRs And RFCs

Project: **Personal Task Manager** (`01-task-manager`)

## PR Template

- What changed:
- Why:
- How tested:
- Screenshots/logs:
- Risks:
- Follow-ups:

## Commit Message Shape

`area: concise behavior change`

Example: `task: add validation for empty title`.

## RFC Template

- Problem
- Current behavior with anchors: `client/src/App.jsx:7`, `server/src/services/taskService.js:17`, `server/src/models/taskModel.js:1`
- Options considered
- Proposed design
- Migration plan
- Test plan
- Rollout/rollback
- Open questions

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
