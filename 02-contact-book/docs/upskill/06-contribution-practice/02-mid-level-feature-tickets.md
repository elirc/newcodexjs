# Mid-Level Feature Tickets

Project: **Contact Book / Address Manager** (`02-contact-book`)

## Ticket 1: Add pagination end to end

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:125`, `client/src/services/api.js:4`, `server/src/routes/contactRoutes.js:5`, `server/src/services/contactService.js:10`, `server/src/models/contactModel.js:1`, `server/db/migrations/202607030201_create_contacts_tags.js:7`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 2: Add integration tests for write flow

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:125`, `client/src/services/api.js:4`, `server/src/routes/contactRoutes.js:5`, `server/src/services/contactService.js:10`, `server/src/models/contactModel.js:1`, `server/db/migrations/202607030201_create_contacts_tags.js:7`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 3: Add ownership checks if auth exists

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:125`, `client/src/services/api.js:4`, `server/src/routes/contactRoutes.js:5`, `server/src/services/contactService.js:10`, `server/src/models/contactModel.js:1`, `server/db/migrations/202607030201_create_contacts_tags.js:7`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 4: Add schema index for list filters

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:125`, `client/src/services/api.js:4`, `server/src/routes/contactRoutes.js:5`, `server/src/services/contactService.js:10`, `server/src/models/contactModel.js:1`, `server/db/migrations/202607030201_create_contacts_tags.js:7`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 5: Add optimistic UI update with rollback

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:125`, `client/src/services/api.js:4`, `server/src/routes/contactRoutes.js:5`, `server/src/services/contactService.js:10`, `server/src/models/contactModel.js:1`, `server/db/migrations/202607030201_create_contacts_tags.js:7`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 6: Add CSV/export flow test

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:125`, `client/src/services/api.js:4`, `server/src/routes/contactRoutes.js:5`, `server/src/services/contactService.js:10`, `server/src/models/contactModel.js:1`, `server/db/migrations/202607030201_create_contacts_tags.js:7`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 7: Add validation schema shared by routes

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:125`, `client/src/services/api.js:4`, `server/src/routes/contactRoutes.js:5`, `server/src/services/contactService.js:10`, `server/src/models/contactModel.js:1`, `server/db/migrations/202607030201_create_contacts_tags.js:7`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 8: Add query logging for slow endpoints

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:125`, `client/src/services/api.js:4`, `server/src/routes/contactRoutes.js:5`, `server/src/services/contactService.js:10`, `server/src/models/contactModel.js:1`, `server/db/migrations/202607030201_create_contacts_tags.js:7`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 9: Add error boundary in client

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:125`, `client/src/services/api.js:4`, `server/src/routes/contactRoutes.js:5`, `server/src/services/contactService.js:10`, `server/src/models/contactModel.js:1`, `server/db/migrations/202607030201_create_contacts_tags.js:7`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Ticket 10: Add migration safety checklist

**Difficulty:** Medium

**Design notes required:** API contract, data shape, test plan, rollback plan.

**Likely anchors:** `client/src/App.jsx:125`, `client/src/services/api.js:4`, `server/src/routes/contactRoutes.js:5`, `server/src/services/contactService.js:10`, `server/src/models/contactModel.js:1`, `server/db/migrations/202607030201_create_contacts_tags.js:7`.

**Risk:** Contract drift or schema change without tests.

**Rollback:** Keep migration reversible and preserve old response shape where possible.

## Verification Notes

- Generated from inspected files in `02-contact-book`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/contactRoutes.js`, `server/src/services/contactService.js`, `server/src/models/contactModel.js`, `server/db/migrations/202607030201_create_contacts_tags.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
