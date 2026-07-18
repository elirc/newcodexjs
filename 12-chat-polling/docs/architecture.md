# Architecture

## Layers

- `client/` uses React 18, Vite, TypeScript, Axios, React Query, and CSS Modules.
- `server/src/routes` defines endpoint surfaces.
- `server/src/controllers` stays thin and delegates to services.
- `server/src/services` contains polling rules, DM dedupe, read receipts, ownership checks, and presence calculations.
- `server/src/models` contains Knex queries only.
- `server/src/middleware` owns validation and centralized error responses.

## Polling model

The active conversation polls `/messages/new?after=messageId` every two seconds. The conversation list polls every five seconds. Presence heartbeat runs every thirty seconds and stores `last_seen_at`. Typing indicators are upserted and treated as expired after five seconds.

## Cursor pagination

Message history uses `before=messageId&limit=30`. The query orders by newest for efficient pagination, then reverses the page so the UI renders oldest first.

## Tradeoffs

This project intentionally avoids WebSockets and full authentication. It uses a demo user header so the data modeling and polling behaviors stay easy to inspect.

