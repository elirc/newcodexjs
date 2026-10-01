# Worked implementation and examples

[Course index](README.md)

## Before and after

**Before:** History, polling, reactions and group-management routes did not consistently verify membership. A duplicate member ID could break group creation.

**After:** A shared route guard verifies the demo user's membership for conversation/message operations, restricts group management to admins and validates read-receipt references. Group creation deduplicates members.

## Predict this example

User 3 cannot read or poll the study room, react to its messages, type there or add members. User 2 can read and react but cannot manage members. A receipt pointing to another room is rejected. The author can edit/delete a message; a deleted message cannot be revived by editing.

Before running anything, write the exact expected stored values and visible response. Include ids or record counts where they matter. Then run the focused tests and reproduce the matching UI/API action. Do not settle for seeing a success message: inspect the authoritative stored result as well.

## Actual implementation excerpt

The lines below are the ones Astra changed (compare `AstraOrganized2/astrafinalplan/implementation/batch04/backups/63/server/src/routes/chatRoutes.ts` with `diff --strip-trailing-cr -w`): the router-level membership guard that resolves the conversation from either path shape, hides non-membership behind 404, restricts group management to admins and validates read receipts. The `messageId` check inside the read-receipt branch was added in this course's fix pass. The linked source is authoritative if you later edit the project.

```typescript
chatRouter.use(async (req, res, next) => {
  try {
    const user = Number(
      req.header("x-demo-user-id") ?? process.env.DEMO_USER_ID ?? 1,
    );
    if (!Number.isSafeInteger(user) || user < 1)
      throw new ValidationError("Invalid demo user id");
    const match = /^\/(conversations|messages)\/(\d+)(?:\/|$)/.exec(req.path);
    if (!match) return next();
    const id = Number(match[2]);
    const message =
      match[1] === "messages"
        ? await db("messages")
            .where({ id })
            .where({ is_deleted: false })
            .first()
        : null;
    if (match[1] === "messages" && !message)
      throw new NotFoundError("Message not found");
    const conversationId = message?.conversation_id ?? id;
    const member = await db("conversation_members")
      .where({ conversation_id: conversationId, user_id: user })
      .first();
    if (!member) throw new NotFoundError("Conversation not found");
    const managesGroup =
      match[1] === "conversations" &&
      ((req.method === "PUT" && /^\/conversations\/\d+$/.test(req.path)) ||
        req.path.includes("/members"));
    if (managesGroup && member.role !== "admin")
      throw new ValidationError(
        "Only group admins may manage this conversation",
      );
    if (req.path.endsWith("/read") && req.method === "POST") {
      // The guard runs before validateBody(readSchema); reject a missing or
      // malformed id here so the lookup below never sees undefined (500).
      const messageId = Number(req.body?.messageId);
      if (!Number.isSafeInteger(messageId) || messageId < 1)
        throw new ValidationError("messageId must be a positive whole number");
      const read = await db("messages")
        .where({ id: messageId, conversation_id: conversationId })
        .first();
      if (!read)
        throw new ValidationError(
          "Read receipt must reference this conversation",
        );
    }
    next();
  } catch (error) {
    next(error);
  }
});
```

## How to reason through the code

1. Identify the inputs. Distinguish data supplied by a caller from state read from storage or a trusted context.
2. Find the guard clauses. For each early return or thrown error, describe which invariant it protects and whether anything has already been written.
3. Find the candidate state or query. Explain whether it mutates an existing object or constructs a replacement.
4. Locate the persistence operation. For asynchronous code, follow the promise through success and rejection; for transactions, check that all related writes use the same transaction object.
5. Find the output or state publication. Ask what a repeated invocation would do after the first invocation succeeds.

Use this project-specific reasoning as your guide:

A foreign key proves that a referenced row exists, not that the caller is allowed to see it. The route guard resolves a message to its conversation and checks the membership pair (conversation_id,user_id). This covers GET history, GET polling, POST reactions and metadata operations with the same rule. Owner checks still decide who may edit a particular message.

A read receipt is not merely any existing message ID. It must belong to the conversation being marked read, or unread calculations become misleading. An administrator role is likewise scoped to the membership row for that conversation; being an admin in another group grants nothing here. The x-demo-user-id header is still freely chosen in this educational app, so this demonstrates authorization structure without providing real authentication.

Polling retrieves messages after a cursor. Membership must be checked on every poll, not only when the UI first opens a room, because membership can change. This central check is a useful boundary, but it is not a transaction spanning every subsequent read; strict coordination with simultaneous membership removal would need additional policy and locking.

## Three variations to work through

**Normal variation — a member reads, an outsider cannot.** As user 2, `GET /api/conversations/<room>/messages`: predict 200 with the seeded message. As user 3 (not a member): predict 404 `Conversation not found`, and explain why the guard chose 404 over 403 (it does not confirm that the room exists).

**Invalid variation — a receipt for the wrong room.** As user 2, `POST /api/conversations/<room>/read` with the id of the `Other` room's message. Predict 400 `Read receipt must reference this conversation` and `last_read_message_id` unchanged. Then send `{}`: predict 400 `messageId must be a positive whole number` (before the fix pass this was a 500).

**Boundary variation — polling after removal.** As admin user 1, remove user 2 with the members route, then as user 2 poll `?after=0`. Predict 404 within the same second, because the guard re-reads `conversation_members` on every request. Then read exercise 7 to see the one window where that is not true.

## Executable examples

These are the actual regression tests in [test/membership.test.ts](../test/membership.test.ts). Read each test as arrange → act → assert. Setup creates a controlled initial state, the action exercises the application code, and assertions compare observable behavior with an independently stated expectation.

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

## Explain it back

Give a five-minute walkthrough: the original problem, one invariant, the exact changed function, the most revealing failure test, and one remaining limitation. You should be able to explain why the implementation is correct for the worked example without reading the code aloud line by line.
