# Maintainer Communication

Project: **Contact Book / Address Manager** (`02-contact-book`)

## Ask For Help Without Outsourcing Thinking

Good question shape:
- What I tried
- What I expected
- What happened
- Files inspected
- Minimal reproduction
- My current hypothesis

## Templates

Bug report: include command, environment, reproduction, expected result, actual result.

Feature proposal: explain user value, existing pattern, blast radius, test plan.

Responding to review: acknowledge, state change, mention verification.

Respectful disagreement: name the tradeoff and propose a small experiment.

## Verification Notes

- Generated from inspected files in `02-contact-book`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/contactRoutes.js`, `server/src/services/contactService.js`, `server/src/models/contactModel.js`, `server/db/migrations/202607030201_create_contacts_tags.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
