# Code Review Mindset

Project: **Contact Book / Address Manager** (`02-contact-book`)

Review layers:

1. Does it work?
2. Is it correct for edge cases?
3. Will it stay correct?
4. Does it fit the codebase boundaries?
5. Is it kind to future maintainers?

Repo-specific checklist:
- UI behavior near `client/src/App.jsx:125`.
- HTTP contract near `client/src/services/api.js:4` and `server/src/routes/contactRoutes.js:5`.
- Business rules near `server/src/services/contactService.js:10`.
- Query shape near `server/src/models/contactModel.js:1`.
- Schema changes near `server/db/migrations/202607030201_create_contacts_tags.js:7`.

Good review language:
> Could we move this rule into the service so every API caller gets the same protection?

## Verification Notes

- Generated from inspected files in `02-contact-book`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/contactRoutes.js`, `server/src/services/contactService.js`, `server/src/models/contactModel.js`, `server/db/migrations/202607030201_create_contacts_tags.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
