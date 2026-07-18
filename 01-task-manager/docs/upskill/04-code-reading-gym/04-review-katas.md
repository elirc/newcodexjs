# Review Katas

Project: **Personal Task Manager** (`01-task-manager`)

## Kata 1: Missing validation

**Author intent:** Improve task CRUD, filtering, completion toggles, overdue highlighting.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:7`, `server/src/services/taskService.js:17`, or `server/src/models/taskModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/taskService.js:17` and add a regression check?

## Kata 2: Unbounded list query

**Author intent:** Improve task CRUD, filtering, completion toggles, overdue highlighting.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:7`, `server/src/services/taskService.js:17`, or `server/src/models/taskModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/taskService.js:17` and add a regression check?

## Kata 3: UI calls fetch directly

**Author intent:** Improve task CRUD, filtering, completion toggles, overdue highlighting.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:7`, `server/src/services/taskService.js:17`, or `server/src/models/taskModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/taskService.js:17` and add a regression check?

## Kata 4: Raw error leaked

**Author intent:** Improve task CRUD, filtering, completion toggles, overdue highlighting.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:7`, `server/src/services/taskService.js:17`, or `server/src/models/taskModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/taskService.js:17` and add a regression check?

## Kata 5: Schema change without seed update

**Author intent:** Improve task CRUD, filtering, completion toggles, overdue highlighting.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:7`, `server/src/services/taskService.js:17`, or `server/src/models/taskModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/taskService.js:17` and add a regression check?

## Kata 6: Delete without confirmation

**Author intent:** Improve task CRUD, filtering, completion toggles, overdue highlighting.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:7`, `server/src/services/taskService.js:17`, or `server/src/models/taskModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/taskService.js:17` and add a regression check?

## Kata 7: Duplicated business rule

**Author intent:** Improve task CRUD, filtering, completion toggles, overdue highlighting.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:7`, `server/src/services/taskService.js:17`, or `server/src/models/taskModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/taskService.js:17` and add a regression check?

## Kata 8: Auth check only in UI

**Author intent:** Improve task CRUD, filtering, completion toggles, overdue highlighting.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:7`, `server/src/services/taskService.js:17`, or `server/src/models/taskModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/taskService.js:17` and add a regression check?

## Verification Notes

- Generated from inspected files in `01-task-manager`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/taskRoutes.js`, `server/src/services/taskService.js`, `server/src/models/taskModel.js`, `server/db/migrations/20260703000000_create_tasks_table.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
