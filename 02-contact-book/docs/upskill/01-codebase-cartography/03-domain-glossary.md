# Domain Glossary

Project: **Contact Book / Address Manager** (`02-contact-book`)

## contact

Meaning in this project: a core domain term used to reason about contacts, tags, search, pagination, CSV workflows.

Where to look:
- `client/src/App.jsx` for user-facing behavior.
- `server/src/services/contactService.js` for rules involving contact.
- `server/db/migrations/202607030201_create_contacts_tags.js` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## tag

Meaning in this project: a core domain term used to reason about contacts, tags, search, pagination, CSV workflows.

Where to look:
- `client/src/App.jsx` for user-facing behavior.
- `server/src/services/contactService.js` for rules involving tag.
- `server/db/migrations/202607030201_create_contacts_tags.js` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## contact_tags

Meaning in this project: a core domain term used to reason about contacts, tags, search, pagination, CSV workflows.

Where to look:
- `client/src/App.jsx` for user-facing behavior.
- `server/src/services/contactService.js` for rules involving contact_tags.
- `server/db/migrations/202607030201_create_contacts_tags.js` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## pagination

Meaning in this project: a core domain term used to reason about contacts, tags, search, pagination, CSV workflows.

Where to look:
- `client/src/App.jsx` for user-facing behavior.
- `server/src/services/contactService.js` for rules involving pagination.
- `server/db/migrations/202607030201_create_contacts_tags.js` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## CSV import/export

Meaning in this project: a core domain term used to reason about contacts, tags, search, pagination, CSV workflows.

Where to look:
- `client/src/App.jsx` for user-facing behavior.
- `server/src/services/contactService.js` for rules involving CSV import/export.
- `server/db/migrations/202607030201_create_contacts_tags.js` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## Verification Notes

- Generated from inspected files in `02-contact-book`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/contactRoutes.js`, `server/src/services/contactService.js`, `server/src/models/contactModel.js`, `server/db/migrations/202607030201_create_contacts_tags.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
