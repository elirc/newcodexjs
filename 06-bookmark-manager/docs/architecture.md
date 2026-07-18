# Bookmark Manager Architecture

## Folder Structure

- `client/`: Vite React UI using CSS Modules.
- `server/`: Express API with controller/service/model layers.
- `server/db/migrations/`: reversible PostgreSQL schema.
- `server/db/seeds/`: realistic development data.

## Request Flow

A request enters `routes`, the controller extracts params/body, the service validates and applies business rules, the model runs Knex queries, and the controller returns `{ success: true, data }`.

## Database Shape

The main learning table is `bookmarks`. It includes timestamps plus these domain fields:

- `title`: string
- `url`: string
- `collection`: string
- `status`: string
- `tags`: json

## Design Decisions

- Keep one main domain workflow per generated project so the architecture is easy to inspect.
- Include migration and seed data so SQL behavior can be studied before the UI is touched.
- Preserve the Tier 1 conventions across all projects so each new app adds concepts without changing the mental model.

## Review Prompts

- Which code belongs in controllers, services, and models?
- Which validation belongs on the client, and which must be repeated on the server?
- How would this schema change when adding authentication or multi-user ownership?
