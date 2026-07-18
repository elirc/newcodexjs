# Framework Mental Models

Project: **Contact Book / Address Manager** (`02-contact-book`)

## React

React renders UI from state. In this project, the main page in `client/src/App.jsx:125` owns local state and calls a service wrapper in `client/src/services/api.js:4`.

Failure modes: stale state, duplicated derived state, effects that refetch too often, and component state that should be URL or server state.

## Express

Express is a middleware pipeline. `server/src/app.js:1` configures global middleware, then mounts routes. `server/src/routes/contactRoutes.js:5` maps HTTP verbs to controllers.

Failure modes: middleware order mistakes, route shadowing, uncaught async errors, and leaking raw exceptions.

## Knex/PostgreSQL

Knex builds SQL queries. `server/src/models/contactModel.js:1` should own query shape; `server/src/services/contactService.js:10` should own business decisions.

Failure modes: unbounded queries, missing indexes, unsafe raw SQL, and missing transactions around multi-step writes.

## Verification Notes

- Generated from inspected files in `02-contact-book`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/contactRoutes.js`, `server/src/services/contactService.js`, `server/src/models/contactModel.js`, `server/db/migrations/202607030201_create_contacts_tags.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
