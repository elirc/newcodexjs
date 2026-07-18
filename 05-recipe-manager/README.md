# Recipe Manager with User Accounts

Project 5 is a TypeScript full-stack app for learning JWT auth, protected routes, nested writes with Knex transactions, and React auth context.

## Run locally

1. Create PostgreSQL database `recipe_manager`.
2. Copy `.env.example` to `.env` and adjust secrets.
3. In `server/`, run `npm install`, `npm run migrate`, `npm run seed`, then `npm run dev`.
4. In `client/`, run `npm install` and `npm run dev`.

The API runs on `http://localhost:4005`; the Vite client runs on `http://localhost:5175`.

## Demo users

All seeded users use password `password123`.

- `maya@example.com`
- `leo@example.com`
- `sam@example.com`

## Features

- Register, login, logout, refresh, and current-user endpoints.
- HTTP-only refresh cookie plus bearer access token returned to the client.
- Public recipe browsing with search/category filters.
- Protected recipe creation, owner-only updates/deletes, my recipes, and favorites.
- Recipe creation stores recipe, ingredients, steps, and categories in one transaction.

See [docs/architecture.md](docs/architecture.md) for the layer map and tradeoffs.
