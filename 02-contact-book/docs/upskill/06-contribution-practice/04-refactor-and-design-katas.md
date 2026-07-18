# Refactor And Design Katas

Project: **Contact Book / Address Manager** (`02-contact-book`)

- Identify a boundary leak between `server/src/controllers/contactController.js:7` and `server/src/services/contactService.js:10`.
- Propose a transaction boundary for a multi-write flow.
- Split a large UI component without changing behavior.
- Improve type safety around `client/src/services/api.js:4`.
- Add pagination without breaking existing clients.
- Reduce a hypothetical N+1 query in `server/src/models/contactModel.js:1`.
- Write an RFC for auth/ownership.
- Review a fake PR that changes `server/db/migrations/202607030201_create_contacts_tags.js:7` without rollback notes.

Self-grade: strong answers name blast radius, migration path, test plan, and rollback.

## Verification Notes

- Generated from inspected files in `02-contact-book`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/contactRoutes.js`, `server/src/services/contactService.js`, `server/src/models/contactModel.js`, `server/db/migrations/202607030201_create_contacts_tags.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
