# Review Katas

Project: **Blog Platform** (`07-blog-platform`)

## Kata 1: Missing validation

**Author intent:** Improve posts, nested comments, rich text, RSS, sanitization.

**Fake diff summary:** Changes one flow that resembles `client/src/App.tsx:17`, `server/src/services/service.ts:5`, or `server/src/models/model.ts:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/service.ts:5` and add a regression check?

## Kata 2: Unbounded list query

**Author intent:** Improve posts, nested comments, rich text, RSS, sanitization.

**Fake diff summary:** Changes one flow that resembles `client/src/App.tsx:17`, `server/src/services/service.ts:5`, or `server/src/models/model.ts:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/service.ts:5` and add a regression check?

## Kata 3: UI calls fetch directly

**Author intent:** Improve posts, nested comments, rich text, RSS, sanitization.

**Fake diff summary:** Changes one flow that resembles `client/src/App.tsx:17`, `server/src/services/service.ts:5`, or `server/src/models/model.ts:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/service.ts:5` and add a regression check?

## Kata 4: Raw error leaked

**Author intent:** Improve posts, nested comments, rich text, RSS, sanitization.

**Fake diff summary:** Changes one flow that resembles `client/src/App.tsx:17`, `server/src/services/service.ts:5`, or `server/src/models/model.ts:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/service.ts:5` and add a regression check?

## Kata 5: Schema change without seed update

**Author intent:** Improve posts, nested comments, rich text, RSS, sanitization.

**Fake diff summary:** Changes one flow that resembles `client/src/App.tsx:17`, `server/src/services/service.ts:5`, or `server/src/models/model.ts:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/service.ts:5` and add a regression check?

## Kata 6: Delete without confirmation

**Author intent:** Improve posts, nested comments, rich text, RSS, sanitization.

**Fake diff summary:** Changes one flow that resembles `client/src/App.tsx:17`, `server/src/services/service.ts:5`, or `server/src/models/model.ts:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/service.ts:5` and add a regression check?

## Kata 7: Duplicated business rule

**Author intent:** Improve posts, nested comments, rich text, RSS, sanitization.

**Fake diff summary:** Changes one flow that resembles `client/src/App.tsx:17`, `server/src/services/service.ts:5`, or `server/src/models/model.ts:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/service.ts:5` and add a regression check?

## Kata 8: Auth check only in UI

**Author intent:** Improve posts, nested comments, rich text, RSS, sanitization.

**Fake diff summary:** Changes one flow that resembles `client/src/App.tsx:17`, `server/src/services/service.ts:5`, or `server/src/models/model.ts:1`.

**Your task:** Review this PR.

**Expected findings:**

Blocking:
- Correctness, security, or data integrity issue if applicable.

Important:
- Boundary ownership or missing test concern.

Optional:
- Naming, copy, or local style issue.

**Good review comment example:**
> I think this rule belongs in the service layer because it protects every caller, not just this UI path. Could we move it near `server/src/services/service.ts:5` and add a regression check?

## Verification Notes

- Generated from inspected files in `07-blog-platform`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
