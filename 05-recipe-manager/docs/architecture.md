# Architecture

## Shape

- `client/` is a React 18 + Vite TypeScript app using CSS Modules and an `AuthContext`.
- `server/` is an Express TypeScript API with Knex models, services for business logic, thin controllers, centralized errors, and a standard `{ success, data | error }` response envelope.
- PostgreSQL migrations are reversible and seeds create realistic recipes, categories, and favorites.

## Auth flow

Login/register returns an access token in the response body for in-memory client use and stores a refresh token in an HTTP-only cookie. On page load the client calls `/api/auth/refresh` to restore an access token. Protected routes send `Authorization: Bearer <token>`.

## Data flow

Controllers read request parameters and call services. Services enforce ownership/visibility rules and use model functions for Knex access. Nested recipe writes use a transaction so recipe, ingredients, steps, categories, and later reads remain consistent.

## Educational tradeoffs

The UI is intentionally compact, but it wires every major concept: auth, protected pages, public browsing, detail views, favorite toggles, and a multi-section create form. Production concerns like image uploads, token rotation device metadata, and exhaustive form validation are left as next steps.
