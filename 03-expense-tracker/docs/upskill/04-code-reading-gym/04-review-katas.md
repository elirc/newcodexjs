# Review Katas

Project: **Personal Expense Tracker** (`03-expense-tracker`)

## Kata 1: Missing validation

**Author intent:** Improve expense CRUD, aggregation, dashboards, budgets.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:82`, `server/src/services/expenseService.js:12`, or `server/src/models/expenseModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/expenseService.js:12` and add a regression check?

## Kata 2: Unbounded list query

**Author intent:** Improve expense CRUD, aggregation, dashboards, budgets.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:82`, `server/src/services/expenseService.js:12`, or `server/src/models/expenseModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/expenseService.js:12` and add a regression check?

## Kata 3: UI calls fetch directly

**Author intent:** Improve expense CRUD, aggregation, dashboards, budgets.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:82`, `server/src/services/expenseService.js:12`, or `server/src/models/expenseModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/expenseService.js:12` and add a regression check?

## Kata 4: Raw error leaked

**Author intent:** Improve expense CRUD, aggregation, dashboards, budgets.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:82`, `server/src/services/expenseService.js:12`, or `server/src/models/expenseModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/expenseService.js:12` and add a regression check?

## Kata 5: Schema change without seed update

**Author intent:** Improve expense CRUD, aggregation, dashboards, budgets.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:82`, `server/src/services/expenseService.js:12`, or `server/src/models/expenseModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/expenseService.js:12` and add a regression check?

## Kata 6: Delete without confirmation

**Author intent:** Improve expense CRUD, aggregation, dashboards, budgets.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:82`, `server/src/services/expenseService.js:12`, or `server/src/models/expenseModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/expenseService.js:12` and add a regression check?

## Kata 7: Duplicated business rule

**Author intent:** Improve expense CRUD, aggregation, dashboards, budgets.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:82`, `server/src/services/expenseService.js:12`, or `server/src/models/expenseModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/expenseService.js:12` and add a regression check?

## Kata 8: Auth check only in UI

**Author intent:** Improve expense CRUD, aggregation, dashboards, budgets.

**Fake diff summary:** Changes one flow that resembles `client/src/App.jsx:82`, `server/src/services/expenseService.js:12`, or `server/src/models/expenseModel.js:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/expenseService.js:12` and add a regression check?

## Verification Notes

- Generated from inspected files in `03-expense-tracker`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/expenseRoutes.js`, `server/src/services/expenseService.js`, `server/src/models/expenseModel.js`, `server/db/migrations/202607030301_create_expense_tracker.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
