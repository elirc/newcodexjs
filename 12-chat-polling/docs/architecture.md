# Architecture

Polling Chat delivers "real-time-like" chat with nothing but HTTP requests on timers. Every claim below points at a file and line you can open; line numbers were checked on 2026-10-06.

## Layers

- `client/` uses React 18, Vite, TypeScript, Axios, React Query and CSS Modules. The whole UI is `client/src/App.tsx` (sidebar plus chat panel); all HTTP goes through `client/src/services/api.ts`.
- `server/src/routes/chatRoutes.ts` defines the endpoints **and** the membership guard (`chatRoutes.ts:18-68`), a router-level middleware that runs before every route's `validateBody`. This is where ownership and admin checks actually live.
- `server/src/controllers/chatController.ts` reads the demo user and request data. About half the controllers call the model directly (update conversation, add/remove member, leave, delete message, remove reaction, heartbeat, typing, mark read); the rest go through the service.
- `server/src/services/chatService.ts` contains message hydration (sender and grouped reactions, `:6-41`), conversation list with unread counts (`:44-76`), DM dedupe (`:79-92`), cursor reads, the send-time membership check (`:127-137`) and presence staleness (`:147-152`).
- `server/src/models/chatModel.ts` contains Knex queries only.
- `server/src/middleware/` owns Zod body validation (`validate.ts`) and the error envelope (`errors.ts:30-44`).

## Data model

From `server/db/migrations/001_init.ts`:

| Table | Key columns and constraints |
|---|---|
| `users` (5-16) | `username` and `email` unique, `password_hash` (unused: there is no login), `status` `CHECK` online/offline/away, `last_seen_at` |
| `conversations` (17-26) | `type` `CHECK` direct/group, `name`, `created_by`, `last_message_at` |
| `messages` (27-41) | `conversation_id` FK cascade, `user_id`, `content`, `is_edited`, `is_deleted`; index on `(conversation_id, created_at)` |
| `conversation_members` (42-60) | composite PK `(conversation_id, user_id)`, `role` `CHECK` admin/member, `last_read_message_id` FK to messages |
| `reactions` (61-78) | unique `(message_id, user_id, emoji)` |
| `typing_indicators` (79-94) | composite PK `(user_id, conversation_id)`, `started_at` |

There is no unique constraint that makes a direct conversation between two users unique; dedupe is done in application code.

## Polling model

All timers live in `client/src/App.tsx`:

- The conversation list refetches every 5 s (`App.tsx:10`).
- The active conversation loads its latest page once (`App.tsx:73`) and then polls `GET /conversations/:id/messages/new?after=<lastId>` every 2 s (`App.tsx:75-80`). New rows are appended into the cached page (`App.tsx:86-93`).
- Typing users are polled every 2 s (`App.tsx:81`); typing is posted on every non-blank keystroke (`App.tsx:100-103`) and upserted server-side (`chatModel.ts:183-192`). Indicators older than 5 s are filtered out on read (`chatModel.ts:200`); stale rows are never deleted.
- A presence heartbeat is sent on mount and every 30 s (`App.tsx:17-21`) and sets `status = 'online'` and `last_seen_at` (`chatModel.ts:211-221`). Every `GET /presence/status` first marks all users unseen for 90 s as offline (`chatService.ts:147-152`).

## Cursor pagination

`listMessages` orders by `id desc`, applies `before` and `limit`, then reverses the page so the UI renders oldest first (`chatModel.ts:102-114`); `nextCursor` is the oldest id on the page (`chatService.ts:115`). The server supports `before`, but the bundled client never sends it (`api.ts:20-21` is only ever called without a cursor), so there is no "load older" in the UI. Polling uses `listMessagesAfter` (`chatModel.ts:117-123`): `id > after`, ascending, capped at 100.

## Identity and the membership guard

There is no authentication. The guard and `userId(req)` (`chatController.ts:7-9`) both read `x-demo-user-id`, falling back to `DEMO_USER_ID` and then 1; the client hard-codes user 1 (`api.ts:4-7`). For any path matching `/conversations/:id/...` or `/messages/:id/...` (`chatRoutes.ts:25`), the guard resolves the conversation (through the message for `/messages/:id` paths, `:28-37`), requires a `conversation_members` row (404 otherwise, `:38-41`), requires `role = 'admin'` for `PUT /conversations/:id` and any `/members` path (`:42-49`, returned as 400 `VALIDATION_ERROR`, not 403), and for `POST .../read` validates `messageId` and checks it belongs to the conversation (`:50-63`). Paths without a numeric id (`/conversations/direct`, `/conversations/group`, `/messages/search`, `/presence/*`) skip the guard.

## Request trace: sending a message (the core write)

1. `ChatPanel` submits the composer; the `send` mutation calls `chatApi.sendMessage(conversation.id, draft)` and on success invalidates the list and the message cache (`App.tsx:83`, `:28-31`).
2. `client/src/services/api.ts:26` posts `{ content }` to `/conversations/:id/messages`.
3. `server/src/app.ts:14-24` parses JSON and rejects non-object bodies (with a string `error`, unlike the normal envelope); `app.ts:29` mounts the router at `/api`.
4. The guard (`chatRoutes.ts:18-68`) confirms membership; then `chatRoutes.ts:100-104` runs `validateBody(messageSchema)` (`validators/chatValidators.ts:13`: 1-4000 characters).
5. `chatController.ts:76-86` calls `service.sendMessage(id, userId, content)` and replies 201.
6. `chatService.ts:127-137` re-checks membership (redundant with the guard but harmless) and calls the model.
7. `chatModel.ts:126-140` (`createMessage`) inserts the message and bumps `conversations.last_message_at` in one transaction, which is what reorders the sidebar (`listConversationsByIds` sorts by it, `chatModel.ts:26-30`).
8. Other members see it on their next 2 s poll via `listMessagesAfter`.

## Senior findings (verified in source)

1. **The `id > after` cursor can skip messages.** Serial ids are assigned at insert time, not commit time. If two sends overlap, message 11 can commit before message 10; a poll that sees 11 advances `lastId` to 11 (`App.tsx:74`), and 10 is never returned by `id > 11` (`chatModel.ts:120`). A safer design polls on a commit-ordered column or re-fetches a small overlap window and de-duplicates by id.
2. **Polling only sees inserts.** Edits (`chatModel.ts:143-149`), soft deletes (`:152-156`) and reactions never change `id`, so other members do not see them until a full refetch. Note too that the client never calls `editMessage` or `deleteMessage`, although `api.ts:28-30` defines them.
3. **Empty conversations never poll.** `newMessages` has `enabled: Boolean(lastId)` (`App.tsx:78`), so a conversation with no messages shows nothing that arrives until the user sends one or reloads.
4. **Read receipts can move backwards and DMs can duplicate.** `markRead` writes whatever id it is given (`chatModel.ts:224-232`), so an older id raises the unread count again; a `GREATEST(...)` update fixes it. `startDirect` checks then inserts with no lock or unique key (`chatService.ts:82-91`), so two simultaneous "start DM" requests can create two direct conversations.

Also worth knowing: `limit` on history is taken straight from the query string (`chatController.ts:70`) with no upper bound, and `GET /presence/status` performs a table-wide `UPDATE` on every read (`chatService.ts:148-150`).

## Debugging scenario

Symptom: the unread badge on a conversation keeps reappearing after you read it. Path: unread is computed per conversation as messages with `id > last_read_message_id` not sent by you (`chatService.ts:61-65`). `last_read_message_id` is set by `POST /conversations/:id/read`, which the client fires whenever `lastId` changes (`App.tsx:95-97`). Check the row: `SELECT last_read_message_id FROM conversation_members WHERE conversation_id = <id> AND user_id = 1;` then compare with `SELECT max(id) FROM messages WHERE conversation_id = <id>;`. If the stored value is lower, look for an out-of-order `read` request (for example a slow request from a previous render) overwriting a newer value, which finding 4 allows.

## Exercise ladder (junior to mid)

1. **Goal:** list every timer the client runs. **Check:** `grep -n "refetchInterval\|setInterval" client/src/App.tsx` returns lines 10, 19, 79 and 81 (5000, 30000, 2000, 2000).
2. **Goal:** explain which requests skip the guard. **Check:** the regex at `chatRoutes.ts:25` requires a numeric second segment; write down why `/messages/search` still only returns your messages (`chatModel.ts:240-246` joins `conversation_members` on your user id).
3. **Goal:** make read receipts monotonic. **Check:** `markRead` uses `GREATEST(coalesce(last_read_message_id, 0), ?)`; a new test posting a newer then an older id leaves the newer one stored. Run locally (needs Postgres): `npm test` with `ASTRA_TEST_DATABASE_URL` set to an `astra_test_*` database (`test/database.ts`).
4. **Goal:** let empty conversations receive messages. **Check:** `newMessages` polls with `after = lastId ?? 0`, and opening an empty DM in one browser shows a message sent from another user id within 2 s.
5. **Goal:** close the cursor gap from finding 1. **Check:** a written design (overlap window or commit-ordered column) plus a test that inserts ids out of commit order and asserts both messages are eventually returned.

## Tradeoffs

The project intentionally avoids WebSockets and real authentication; a demo user header keeps the data modeling and polling behavior easy to inspect. The cost is visible in the findings: polling by id is simple but only approximates delivery guarantees that a push channel with acknowledgements would make explicit.
