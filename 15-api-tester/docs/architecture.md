# Architecture

## Backend

The Express backend uses thin controllers, service-level business logic, Knex models, Zod validation, centralized error middleware, and a consistent response envelope.

Key services:

- `proxyService`: interpolates environment variables, normalizes params/headers/auth, sends the request with Axios, measures total time, and writes history.
- `collectionService`: manages collection trees, folders, saved requests, duplicate, import, and export.
- `environmentService`: manages active environments and bulk variable replacement.
- `historyService`: provides paginated execution history.

## Data model

The schema includes `users`, `environments`, `env_variables`, `collections`, `folders`, `saved_requests`, and `request_history`. JSON-like request data is stored in `jsonb` columns for headers, params, auth config, request headers, and response headers.

Secret variables stay in the database and are masked in the UI. Collection export intentionally exports saved request data, not environment secrets.

## Variable interpolation

The shared interpolation pattern is:

```ts
template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] ?? match)
```

The backend applies this to URL, query params, header values, body content, and auth fields before dispatching the proxy request.

## Frontend

The React app is a dense tool UI built for repeated use:

- Left panel: collections tree or request history.
- Center panel: tabbed request builder with URL, params, headers, body, and auth.
- Right panel: response status, body, headers, and timing.

CodeMirror is mounted directly in a reusable `CodeEditor` component so JSON request bodies and response bodies use the same editor wiring.
