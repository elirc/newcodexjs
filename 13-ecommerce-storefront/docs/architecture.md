# Architecture

## Layers

- `client/` is a React 18 Vite app using TypeScript, Axios, React Query, and CSS Modules.
- `server/src/routes` maps endpoints to thin controllers.
- `server/src/controllers` extracts ids, headers, params, and bodies.
- `server/src/services` owns cart merge rules, checkout transactions, stock checks, review verification, and admin stats.
- `server/src/models` contains Knex-only data access.
- `server/src/middleware` handles validation and error responses.

## Checkout transaction

Checkout validates cart contents and stock, snapshots product names and prices, creates the order and order items, decrements stock, and clears the cart inside one Knex transaction.

## Cart persistence

Guest carts are stored server-side by `session_id`; the browser keeps only the session id in `localStorage`. Logged-in users use `user_id`. The merge endpoint combines guest and user cart items by keeping the larger quantity for duplicates.

## Tradeoffs

Payments are mocked and role checks are intentionally small. The frontend uses a dense single-screen learning UI instead of separate route files so the whole commerce flow remains easy to read.

