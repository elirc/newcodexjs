# Mid-Level Feature Tickets

Project: **Notes App** (`04-notes-app`)

## Ticket 1: Add pagination end to end

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:18`, `client/src/services/api.js:4`, `server/src/routes/routes.js:3`, `server/src/services/service.js:3`, `server/src/models/model.js:1`, `server/db/migrations/001_init.js:2`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 2: Add integration tests for write flow

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:18`, `client/src/services/api.js:4`, `server/src/routes/routes.js:3`, `server/src/services/service.js:3`, `server/src/models/model.js:1`, `server/db/migrations/001_init.js:2`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 3: Add ownership checks if auth exists

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:18`, `client/src/services/api.js:4`, `server/src/routes/routes.js:3`, `server/src/services/service.js:3`, `server/src/models/model.js:1`, `server/db/migrations/001_init.js:2`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 4: Add schema index for list filters

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:18`, `client/src/services/api.js:4`, `server/src/routes/routes.js:3`, `server/src/services/service.js:3`, `server/src/models/model.js:1`, `server/db/migrations/001_init.js:2`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 5: Add optimistic UI update with rollback

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:18`, `client/src/services/api.js:4`, `server/src/routes/routes.js:3`, `server/src/services/service.js:3`, `server/src/models/model.js:1`, `server/db/migrations/001_init.js:2`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 6: Add CSV/export flow test

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:18`, `client/src/services/api.js:4`, `server/src/routes/routes.js:3`, `server/src/services/service.js:3`, `server/src/models/model.js:1`, `server/db/migrations/001_init.js:2`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 7: Add validation schema shared by routes

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:18`, `client/src/services/api.js:4`, `server/src/routes/routes.js:3`, `server/src/services/service.js:3`, `server/src/models/model.js:1`, `server/db/migrations/001_init.js:2`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 8: Add query logging for slow endpoints

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:18`, `client/src/services/api.js:4`, `server/src/routes/routes.js:3`, `server/src/services/service.js:3`, `server/src/models/model.js:1`, `server/db/migrations/001_init.js:2`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 9: Add error boundary in client

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:18`, `client/src/services/api.js:4`, `server/src/routes/routes.js:3`, `server/src/services/service.js:3`, `server/src/models/model.js:1`, `server/db/migrations/001_init.js:2`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 10: Add migration safety checklist

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:18`, `client/src/services/api.js:4`, `server/src/routes/routes.js:3`, `server/src/services/service.js:3`, `server/src/models/model.js:1`, `server/db/migrations/001_init.js:2`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
