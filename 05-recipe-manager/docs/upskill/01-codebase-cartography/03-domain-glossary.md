# Domain Glossary

Project: **Recipe Manager** (`05-recipe-manager`)

## user

Meaning in this project: a core domain term used to reason about auth, protected recipes, public/private recipes, favorites.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/recipeService.ts` for rules involving user.
- `server/db/migrations/001_initial_schema.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## recipe

Meaning in this project: a core domain term used to reason about auth, protected recipes, public/private recipes, favorites.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/recipeService.ts` for rules involving recipe.
- `server/db/migrations/001_initial_schema.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## ingredient

Meaning in this project: a core domain term used to reason about auth, protected recipes, public/private recipes, favorites.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/recipeService.ts` for rules involving ingredient.
- `server/db/migrations/001_initial_schema.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## step

Meaning in this project: a core domain term used to reason about auth, protected recipes, public/private recipes, favorites.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/recipeService.ts` for rules involving step.
- `server/db/migrations/001_initial_schema.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## favorite

Meaning in this project: a core domain term used to reason about auth, protected recipes, public/private recipes, favorites.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/recipeService.ts` for rules involving favorite.
- `server/db/migrations/001_initial_schema.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## JWT

Meaning in this project: a core domain term used to reason about auth, protected recipes, public/private recipes, favorites.

Where to look:
- `client/src/App.tsx` for user-facing behavior.
- `server/src/services/recipeService.ts` for rules involving JWT.
- `server/db/migrations/001_initial_schema.ts` for durable persistence shape.

Interview angle: define the noun, describe its lifecycle, then name one invariant or failure mode.

## Verification Notes

- Generated from inspected files in `05-recipe-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/recipeRoutes.ts`, `server/src/services/recipeService.ts`, `server/src/models/recipeModel.ts`, `server/db/migrations/001_initial_schema.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
