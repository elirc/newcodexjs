# FABLE Guide — Multi-User Chat (HTTP Polling)

**Project 12: real-time behavior with no real-time transport.** This chat app has
direct and group conversations, unread counts, read receipts, typing indicators,
presence, reactions, and search — built entirely on plain HTTP requests. That
constraint is the curriculum: you learn **cursor pagination**, **polling loops**, and
**ephemeral state modeling** so precisely that when you later add WebSockets
(Project 19's territory), you'll know exactly what the socket is and isn't buying you.

Most "real-time" features in production apps are, in fact, polling. Knowing when
that's fine is a senior judgment; this project gives you the data to make it.

---

## 1. What is new in this project

| Pattern | Where it lives | Why it matters |
|---|---|---|
| Cursor pagination, both directions | `GET .../messages` with `before` (history) and `GET .../messages/new` with `after` (polling) | The fix for Project 2's offset-pagination bug, in its natural habitat: an append-heavy feed. |
| The polling loop | client `App.tsx` + `services/api.ts` | Interval fetch with a moving cursor: cheap requests that usually return `[]`. |
| Presence via heartbeat | `POST /api/presence/heartbeat` + `GET /api/presence/status` | "Online" = "heartbeat within N seconds" — presence is *derived from recency*, not stored as a boolean. |
| Ephemeral state with TTL | typing indicators, filtered to the last 5 s on read (`chatModel.listTyping`) | State that must *expire*: here nothing deletes stale rows; they are only ignored. Who should clean them up, and when? |
| Read receipts & unread counts | `POST .../read`, unread math in the service | Per-user-per-conversation watermarks — a `last_read_message_id` beats a `read` flag per message. Verify which this app chose and why. |
| Membership-scoped access | conversation members table | Every message query must check "is the requester a member?" — your first data-access rule that isn't ownership. |

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL + Zod validators.
API on **:4112** (`server/src/config/env.ts`), client on :5174 (`client/vite.config.ts`).
Demo auth: `x-demo-user-id` header (defaults to user 1) — same stub as Project 11.

## 2. Run it (10 minutes)

```bash
cd 12-chat-polling/server && cp ../.env.example .env   # create the DB it names
npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 12-chat-polling/client && npm install && npm run dev
```

**The two-browser test is mandatory:** open the app twice (one window normal, one
incognito won't matter — identity is the header/default; change the demo user by
editing the header in `client/src/services/api.ts` or via curl). Send messages as
user 2 with curl and watch user 1's window pick them up on the next poll:

```bash
curl "http://localhost:4112/api/conversations" -H "x-demo-user-id: 1"
curl -X POST "http://localhost:4112/api/conversations/1/messages" \
  -H "content-type: application/json" -H "x-demo-user-id: 2" \
  -d '{"content":"hello from curl"}'
# the polling cursor in action — only messages after id 42:
curl "http://localhost:4112/api/conversations/1/messages/new?after=42" -H "x-demo-user-id: 1"
```

Open devtools → Network and just *watch* for a minute. Count requests per minute per
conversation. That number is the cost of polling; remember it for the Level 3 memo.

## 3. Guided code tour (read in this order)

| # | File | Notice this |
|---|------|-------------|
| 1 | `server/src/routes/chatRoutes.ts` | Read every line — ~20 routes is a real API surface. Note which have `validateBody` and which trust only the URL. |
| 2 | `server/src/services/chatService.ts` | The rules: who may edit/delete a message (author only, enforced in the model's `WHERE`), and what `leave` does to a direct conversation. Membership and admin checks for reads and member management are *not* here: they are in the router-level guard at the top of `chatRoutes.ts`. |
| 3 | `server/src/models/chatModel.ts` | Cursor queries: `where id < before` + `orderBy desc` + `limit` for history; `where id > after` for polling. Ask: why cursor on `id` and not `created_at`? (Ties, clock skew.) |
| 4 | Presence/typing handling (service + model) | Heartbeat writes a timestamp; status *compares* timestamps. Typing rows are never deleted: `listTyping` just ignores rows older than 5 s. Presence is marked offline (90 s threshold) as a side effect of `GET /presence/status`. What happens to the tables if nobody ever reads them? |
| 5 | `client/src/App.tsx` | The polling loop is React Query's `refetchInterval`, not a hand-written timer: the `after` cursor (`lastId`) is part of the query key, so a new id starts a new query. Only the presence heartbeat uses `setInterval`. Look for how it holds the "latest id" and when polling is disabled (`enabled: Boolean(lastId)`). |
| 6 | `server/src/validators/chatValidators.ts` | Message length caps, reaction emoji rules. The public edge, same as Project 11. |

## 4. Trace this flow

**"User 1 sees user 2's message":** user 2 POSTs → row inserted → user 1's timer
fires `GET .../messages/new?after=<lastSeenId>` → row comes back → client appends and
advances the cursor → read marker POSTs → user 2's next poll shows the receipt.
Now enumerate every delay in that chain and bound the worst-case latency. That formula
(poll interval + request time) is the number WebSockets exists to remove.

## 5. The challenge ladder

### Level 1 — Junior
1. **Make the poll interval adaptive:** fast (2s) when the window is focused, slow
   (30s) when `document.visibilityState === 'hidden'`. Measure the request-count drop.
2. **Unread badge correctness:** switch conversations, receive messages in the
   background one, verify counts. Your own messages are already excluded
   (`whereNot({ user_id })` in `listConversations`); find a case that is still wrong
   (hint: `markRead` stores whatever id it receives, even an older one) and fix it.

### Level 2 — Mid
3. **Deduplicate and order:** if a poll response overlaps with an optimistic local
   append (you send a message and it also arrives via the next poll), do messages
   duplicate? Key the client's message list by server id and handle the "pending →
   confirmed" transition. This is Project 8's optimistic pattern meeting a feed.
4. **Long-polling upgrade:** change `/messages/new` to hold the request open up to
   25s, returning early when a new message arrives (in-process `EventEmitter` keyed by
   conversation id is enough). Client switches from interval-poll to
   request-when-previous-returns. Measure latency before/after. Note what broke:
   server connection counts, timeout tuning, proxy behavior.
5. **Test the membership guard:** curl a conversation's messages as a non-member and
   assert the failure. Then audit *every* route in `chatRoutes.ts` for the same guard —
   write down any route that leaks data (search is the usual suspect).

### Level 3 — Senior
6. **Transport memo (1 page):** polling vs. long-polling vs. SSE vs. WebSockets for
   *this* app at three scales (10 users, 10k, 1M). Cover: latency, connection cost,
   proxy/CDN friendliness, reconnect/backfill story (cursors make backfill trivial —
   that's the argument polling never gets credit for), and operational complexity.
   End with the honest recommendation per scale.
7. **Unread-count scalability:** unread math per conversation per user is a query —
   at what member count does computing it on every list load hurt, and what's the
   denormalization (a `last_read` watermark table + counter cache)? Relate it to
   Project 10's ledger-vs-cache decision.

## 6. Questions you should be able to answer afterward

- Why does `before`/`after` cursor pagination avoid the skips and duplicates of offset pagination when rows are inserted, and why can an `id > after` poll still skip a message whose transaction commits after a higher id? (Serial ids are assigned at insert, not commit.)
- Why is presence derived from a heartbeat timestamp instead of set by login/logout events? (Crashed tabs never send "logout".)
- Where can typing-indicator state live besides the DB (memory, Redis), and what does each choice cost this app?
- What makes polling *stateless* for the server, and why does that matter for horizontal scaling — the argument that keeps polling in production systems?
- Read receipts: watermark (`last_read_message_id`) vs. per-message read rows — when is each right? (Group chats make per-message rows explode.)

## 7. Common traps

- **`setInterval` + stale closure:** the timer captures an old `after` cursor and refetches the same messages forever. The fix (ref or functional state) is a React interview staple — make sure you can explain *why* it happens.
- **Polling without `AbortController`:** in a hand-rolled loop, switching conversations mid-request lets the old response land in the new conversation's state. This app's query keys include `conversation.id`, which is what protects it; confirm that before relying on it.
- **Editing messages breaks cursors?** No — edits change content, not ids. But your client must *re-render* edited messages that arrive again. Check whether `/messages/new` even returns edits (probably not — that's a design gap worth writing down).
- **Presence flapping:** a 10s heartbeat with a 12s threshold marks users offline on one dropped request. Threshold ≈ 2.5× interval (this app: 30 s heartbeat, 90 s threshold).

Next: Project 13 (`13-ecommerce-storefront`) — carts, checkout transactions, and the
guest-to-user identity problem.
