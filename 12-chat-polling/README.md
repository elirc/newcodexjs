# Project 12: Multi-User Chat App (HTTP Polling)

A self-contained TypeScript chat app that demonstrates real-time-like behavior without WebSockets.

## Run locally

1. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
2. Copy the project-root `.env.example` into `server/.env` and create the database. (The root `package.json` also offers `npm run db:migrate`, `npm run db:seed`, `npm run dev` and `npm test`; tests need `ASTRA_TEST_DATABASE_URL` pointing at an `astra_test_*` database.)
3. Run:
   ```bash
   cd server
   npm run migrate
   npm run seed
   npm run dev
   cd ../client
   npm run dev
   ```

## Demo auth

The API reads `x-demo-user-id` and defaults to user `1`. This keeps the project focused on conversation modeling, polling, and read state.

## Included scope

- Direct and group conversations.
- Message history with `before` cursor pagination (server-side; the bundled client loads only the latest page).
- Active polling with `after` cursor.
- Presence heartbeat, stale typing indicators filtered out after 5 seconds, unread counts, read receipts.
- Emoji reactions, edit/delete-own-message behavior (API only; the client has no edit/delete buttons), and search.

See [docs/architecture.md](docs/architecture.md) for design notes.

## Junior SWE learning course

[Start the detailed Astra upskilling course](astraupskill/README.md): membership predicates and shared route guards, with a codebase map, worked implementation, executable examples, debugging labs, exercises and solution discussions.
