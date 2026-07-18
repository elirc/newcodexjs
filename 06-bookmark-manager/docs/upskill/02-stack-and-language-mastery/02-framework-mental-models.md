# Framework Mental Models

Project: **Bookmark Manager** (`06-bookmark-manager`)

## React

React renders UI from state. In this project, the main page in `client/src/App.tsx:17` owns local state and calls a service wrapper in `client/src/services/api.ts:4`.

Failure modes: stale state, duplicated derived state, effects that refetch too often, and component state that should be URL or server state.

## Express

Express is a middleware pipeline. `server/src/app.ts:2` configures global middleware, then mounts routes. `server/src/routes/routes.ts:4` maps HTTP verbs to controllers.

Failure modes: middleware order mistakes, route shadowing, uncaught async errors, and leaking raw exceptions.

## Knex/PostgreSQL

Knex builds SQL queries. `server/src/models/model.ts:1` should own query shape; `server/src/services/service.ts:5` should own business decisions.

Failure modes: unbounded queries, missing indexes, unsafe raw SQL, and missing transactions around multi-step writes.

## Verification Notes

- Generated from inspected files in `06-bookmark-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
