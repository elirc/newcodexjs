# Trace lab: Polling Chat: scope every conversation operation

[Course index](README.md) · [Worked change](03-WORKED-CHANGE.md) · [Tests](04-TESTING-AND-DEBUGGING.md)

## Run it before you trace it

The first executable example from chapter 03, so the trace starts from a request you have actually sent:

```typescript
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { database, request } from "./database.js";
let h: Awaited<ReturnType<typeof database>>,
  room: number,
  message: number,
  foreign: number;
before(async () => {
  h = await database();
  await h
    .db("users")
    .insert(
      [1, 2, 3].map((id) => ({
        id,
        username: "user" + id,
        email: `u${id}@example.com`,
        password_hash: "demo",
        display_name: "User " + id,
      })),
    );
  room = (
    await h
      .db("conversations")
      .insert({ type: "group", name: "Study", created_by: 1 })
      .returning("id")
  )[0].id;
  await h.db("conversation_members").insert([
    { conversation_id: room, user_id: 1, role: "admin" },
    { conversation_id: room, user_id: 2, role: "member" },
  ]);
  message = (
    await h
      .db("messages")
      .insert({ conversation_id: room, user_id: 1, content: "Hello" })
      .returning("id")
  )[0].id;
  const other = (
    await h
      .db("conversations")
      .insert({ type: "group", name: "Other", created_by: 3 })
      .returning("id")
  )[0].id;
  foreign = (
    await h
      .db("messages")
      .insert({ conversation_id: other, user_id: 3, content: "Private" })
      .returning("id")
  )[0].id;
});
after(async () => {
  if (h) await h.close();
});
const api = (path: string, method = "GET", body?: unknown, user = 1) =>
  request(h.origin, "/api" + path, method, body, {
    "x-demo-user-id": String(user),
  });
test("outsiders cannot read history, poll, react, type, or change membership", async () => {
  for (const [path, method, body] of [
    [`/conversations/${room}/messages`, "GET", undefined],
    [`/conversations/${room}/messages/new`, "GET", undefined],
    [`/messages/${message}/reactions`, "POST", { emoji: "+1" }],
    [`/conversations/${room}/typing`, "POST", {}],
    [`/conversations/${room}/members`, "POST", { userId: 3 }],
  ] as const)
    assert.equal((await api(path, method, body, 3)).status, 404);
  assert.equal(Number((await h.db("reactions").count("* as n").first()).n), 0);
});
test("members can read and react but only admins manage membership", async () => {
  assert.equal(
    (await api(`/conversations/${room}/messages`, "GET", undefined, 2)).status,
    200,
  );
  assert.equal(
    (await api(`/messages/${message}/reactions`, "POST", { emoji: "+1" }, 2))
      .status,
    201,
  );
  assert.equal(
    (await api(`/conversations/${room}/members`, "POST", { userId: 3 }, 2))
      .status,
    400,
  );
  assert.equal(
    (
      await api(
        `/conversations/${room}/read`,
        "POST",
        { messageId: foreign },
        2,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await api(
        `/conversations/${room}/read`,
        "POST",
        { messageId: message },
        2,
      )
    ).status,
    200,
  );
});
test("owned message CRUD and deduplicated group membership still work", async () => {
  const r = await api(`/conversations/${room}/messages`, "POST", {
    content: "Draft",
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const id = r.data.data.id;
  assert.equal(
    (await api(`/messages/${id}`, "PUT", { content: "Edited" })).status,
    200,
  );
  assert.equal(
    (await api(`/messages/${id}`, "PUT", { content: "Other" }, 2)).status,
    404,
  );
  assert.equal((await api(`/messages/${id}`, "DELETE")).status, 200);
  assert.equal(
    (await api(`/messages/${id}`, "PUT", { content: "Revived" })).status,
    404,
  );
  assert.equal(
    (
      await api("/conversations/group", "POST", {
        name: "Group",
        memberIds: [1, 2, 2],
      })
    ).status,
    201,
  );
});

test("a read receipt without a message id is a 400, not a crash", async () => {
  for (const body of [{}, { messageId: "abc" }, { messageId: 0 }, { messageId: 1.5 }]) {
    const r = await api(`/conversations/${room}/read`, "POST", body, 2);
    assert.equal(r.status, 400, JSON.stringify(body));
  }
  assert.equal((await api(`/conversations/${room}/read`, "POST", { messageId: message }, 2)).status, 200);
  assert.equal(
    (await h.db("conversation_members").where({ conversation_id: room, user_id: 2 }).first()).last_read_message_id,
    message,
  );
});
```

Watch the server log while it runs, then follow the boundaries below with that exact request in mind.

## The concrete case

This lab connects one visible action to the code that accepts or rejects it. Use a disposable dataset and write your prediction before running the operation. The goal is to explain what each boundary contributes, not to memorize a sequence of clicks.

User 3 cannot read or poll the study room, react to its messages, type there or add members. User 2 can read and react but cannot manage members. A receipt pointing to another room is rejected. The author can edit/delete a message; a deleted message cannot be revived by editing.

## Write the record before touching the form

Users join conversations through conversation_members, whose role is admin/member. Messages reference a conversation and author. Reactions reference a message and user. Read receipts store last_read_message_id on membership rows; typing indicators also reference conversation/user.

Make a small table in your own notes with these columns: field, starting value, proposed value, and source of truth. Include identity even when the form does not display it. Include related rows or stored counters when the operation changes more than one fact. Mark a value as derived if the app recomputes it rather than storing it independently.

For example, an edit can change a title while preserving an ID. A status command can keep the same status while producing no new history. An import can contain many rows yet be rejected before any replacement begins. In each case, the meaningful observation is the promised resulting state. A success toast alone cannot establish which fields changed.

## Trace the real call path

### Boundary 1 — the chat screen decides what to send

`client/src/App.tsx`: the conversation list is a `useQuery` with `refetchInterval: 5000` (line 10); the open room loads history with `chatApi.getMessages` (line 73) and polls `newMessages` for rows after the last known id (line 75). Sending a message, reacting, typing and marking read are `useMutation`s that call `client/src/services/api.ts`. The demo identity is a header the client chooses; nothing on the client can prove membership.

### Boundary 2 — the request leaves the browser

`client/src/services/api.ts`: every call goes through one axios instance that adds `x-demo-user-id`; `markRead(conversationId, messageId)` (line 38) posts `{ messageId }` to `/conversations/:id/read`, `getMessages` reads `/conversations/:id/messages`, polling reads `?after=<id>`. The envelope is unwrapped by `unwrap()`; a 404 from the guard becomes `Error("Conversation not found")` in the UI.

### Boundary 3 — the guard decides who may touch which conversation

`server/src/routes/chatRoutes.ts` `chatRouter.use` (line 18): parses the demo user, matches the path, resolves the conversation (via `messages.conversation_id` for `/messages/:id` paths), checks `conversation_members`, demands `role = 'admin'` for group management, and for `POST .../read` validates `messageId` and checks the message belongs to this conversation. All of it before `validateBody` and before any controller; outsiders get 404, non-admins 400, malformed receipts 400.

### Boundary 4 — the service and model apply the change

`controllers/chatController.ts` `markRead` (line 178) calls `model.markRead(conversationId, userId, messageId)` (`models/chatModel.ts:224`), a single `UPDATE conversation_members SET last_read_message_id = ?` scoped by conversation and user. Message CRUD is scoped the same way: `updateMessage(id, userId, content)` and `deleteMessage(id, userId)` carry the author in the `WHERE`, so a member cannot edit another member's message even though the guard let them into the room.

### Boundary 5 — PostgreSQL commits the row

Each of these operations is one statement; there is no explicit transaction, so the row is either updated or not. Polling relies on `messages.id` being monotonic: `listMessagesAfter` (`chatModel.ts:117`) is `WHERE id > ? ORDER BY id ASC LIMIT 100`, and unread counts are `count(*) WHERE id > last_read_message_id`. That is why the read receipt stores an id, not a timestamp.

### Boundary 6 — the envelope tells the client what happened

`utils/http.ts` `sendSuccess` returns `{ success: true, data }`; `middleware/errors.ts` maps `ValidationError` to 400, `NotFoundError` to 404, everything else to 500. After `markRead` succeeds the client invalidates the `conversations` query so the unread badge is recomputed from the server, not decremented locally.

## Predict the regression scenarios

| Scenario from the executable suite | Prediction to write before running |
|---|---|
| outsiders cannot read history, poll, react, type, or change membership | Initial records, request/input, expected result, and records that must remain unchanged. |
| members can read and react but only admins manage membership | Initial records, request/input, expected result, and records that must remain unchanged. |
| owned message CRUD and deduplicated group membership still work | Initial records, request/input, expected result, and records that must remain unchanged. |

Open the test file and identify the arrange, act and assert portions. Arrange creates the synthetic starting state. Act calls the real boundary. Assert reads the observable result. Some tests repeat a call or issue two calls together; explain why a single ordinary call would miss that defect. Tests may share a deliberate fixture within one suite, so read setup and earlier scenario state before copying one case into a standalone script.

## A successful request, described precisely

Start with a valid fixture from the test. Copy the values into your own learning notes rather than copying a personal record. State which fields are required, which may be omitted and which have a special meaning when empty. Execute the operation once. Compare the response with a fresh authoritative read, then compare the UI with that read. If the UI is still loading, wait for the actual expected condition instead of guessing a fixed delay.

Record the stable ID and one changed field. Record at least one field that must remain the same. If the operation creates a child, record the parent ID stored on the child. If it updates an aggregate, compute the expected aggregate by hand. If it restores a backup, count retained, ignored and recreated records according to this project’s documented policy. These observations make a small example reusable when the implementation changes.

## A rejected request, described precisely

Now change one value to a rejected case named in the test suite. Keep everything else identical. Predict where validation fails. Run it and capture both the feedback and the authoritative state afterward. Compare the saved record, related rows and relevant counters with their pre-request values. A controlled error is useful only if the application also preserves the intended state.

Do not assume that all failures have the same status or message. Invalid input, missing records, conflicts and infrastructure errors represent different conditions. Read this app’s handler or parser to see the actual result. Browser-only parsers return a success/error union or throw an import error rather than returning an HTTP status. Translate the same correctness idea into the contract this app actually exposes.

## Read the storage boundary

The [test/database.ts](../test/database.ts) helper demonstrates migration-based isolation. It sets DATABASE_URL before importing the Knex connection and uses a unique PostgreSQL schema. The root workspace also makes pg and tsx available to the root test directory. A source import ending in .js is intentional: TypeScript resolves its .ts source during development and emitted Node code resolves .js after compilation.

Place a breakpoint immediately before the first write and another after the final write or publish step. On the success path, note what changed between those points. On the rejected-input path, the first write should never be reached when validation promises pre-write rejection. On a transactional failure path, some statements may execute and then roll back; reaching a write statement does not mean its effect committed.

An await marks a place where another operation can run. It does not itself define a transaction. When the test uses Promise.all, sketch request A and request B in two columns. Show where each acquires a lock or reads state. The test should accept either winner while insisting on the same final invariant. For synchronous or browser-only validation, explain why concurrency is outside the tested function rather than borrowing a database explanation that does not apply.

## Explain the design tradeoff

A foreign key proves that a referenced row exists, not that the caller is allowed to see it. The route guard resolves a message to its conversation and checks the membership pair (conversation_id,user_id). This covers GET history, GET polling, POST reactions and metadata operations with the same rule. Owner checks still decide who may edit a particular message.

A read receipt is not merely any existing message ID. It must belong to the conversation being marked read, or unread calculations become misleading. An administrator role is likewise scoped to the membership row for that conversation; being an admin in another group grants nothing here. The x-demo-user-id header is still freely chosen in this educational app, so this demonstrates authorization structure without providing real authentication.

Polling retrieves messages after a cursor. Membership must be checked on every poll, not only when the UI first opens a room, because membership can change. This central check is a useful boundary, but it is not a transaction spanning every subsequent read; strict coordination with simultaneous membership removal would need additional policy and locking.

## Change one requirement independently

**Practice task:** Add clear UI feedback when access to an open conversation is removed.

Before implementation, write three acceptance criteria: an ordinary successful case, a rejected or cancelled case, and a case that preserves existing behavior. Identify the smallest file boundary that owns the rule. Keep the existing regression suite; add a test only when it observes a new promise. Do not reproduce the implementation line by line inside the assertion, because both copies can contain the same mistake.

After a first attempt, compare your design with this hint: Stop the polling loop after the access error, clear protected content and show a way to choose another conversation.

## Debug a disagreement between layers

If the form and response disagree, inspect the request payload before editing the database code. If the response and database disagree, inspect the mapper, transaction and read query. If a test fails before an HTTP request is logged, inspect startup, environment variables and the test fixture. Missing dependencies, a busy port or an unavailable database are different from a failed business assertion. Preserve the first useful error and fix that cause before interpreting later cascading failures.

When a date looks wrong, distinguish a calendar label from an instant and check the serialization boundary. When an optional field will not clear, distinguish omission from an explicit empty/null value. When a list seems to lose a record, inspect filtering, sorting and pagination before assuming deletion. When history duplicates, compare desired-state commands with commands that represent a new event. These are diagnostic questions to apply to the actual fields above.

## Final independent checkpoint

Close this guide and give a five-minute walkthrough using only the application source and one test. Explain the user-visible problem, the input contract, the identity model, the write boundary, a failed operation and the remaining limitation. Then modify the worked fixture and predict the result without running it. Reopen the guide only after writing your answer.

A useful review note includes the exact command run, its result, and the boundary it covers. Keep browser interaction, simulated storage tests, real HTTP/database tests and compile checks distinct. The [verification page](VERIFICATION.md) records this delivery’s evidence. Exercises and proposed extensions in this course remain learner work; they are not counted as implemented features.
