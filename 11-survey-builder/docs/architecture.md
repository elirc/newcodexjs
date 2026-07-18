# Architecture

## Layers

- `client/` is a React 18 Vite app using TypeScript, Axios, React Query, and CSS Modules.
- `server/src/routes` maps HTTP endpoints to thin controllers.
- `server/src/controllers` extracts request data and returns the standard response envelope.
- `server/src/services` owns business rules such as activation, response limits, aggregation, duplication, and CSV export.
- `server/src/models` contains Knex-only database access.
- `server/src/middleware` centralizes validation and error formatting.

## Data model

Surveys own ordered questions. Choice questions own options. Responses are split into `responses` and `response_answers` so each question type can store the answer shape it needs while preserving relational joins.

The `questions.config` JSONB column stores type-specific settings such as rating ranges, matrix rows and columns, and numeric bounds. This avoids creating many sparse columns while keeping the core question fields queryable.

## API conventions

Every successful response uses:

```json
{ "success": true, "data": {} }
```

Every error response uses:

```json
{ "success": false, "error": { "message": "Readable message", "code": "ERROR_CODE" } }
```

## Tradeoffs

This educational app uses a `x-demo-user-id` header instead of full authentication. Drag-and-drop is represented with up/down reorder buttons so the behavior is understandable without another package.

