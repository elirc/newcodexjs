# Type System And Contracts

Project: **Contact Book / Address Manager** (`02-contact-book`)

This project is JavaScript-based for early Tier 1 fundamentals.

## Contracts To Watch

- UI form shape: `client/src/App.jsx:125`.
- HTTP request/response shape: `client/src/services/api.js:4` and `server/src/routes/contactRoutes.js:5`.
- Domain payload shape: `server/src/services/contactService.js:10`.
- Database row shape: `server/db/migrations/202607030201_create_contacts_tags.js:7`.

## Junior Mistake

Treating the database row as the UI state. Better: let the API service normalize response shape so the UI is not coupled to persistence.

## Drill

Write a small contract table: field, source, validation owner, persistence column, display owner.

## Verification Notes

- Generated from inspected files in `02-contact-book`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/contactRoutes.js`, `server/src/services/contactService.js`, `server/src/models/contactModel.js`, `server/db/migrations/202607030201_create_contacts_tags.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
