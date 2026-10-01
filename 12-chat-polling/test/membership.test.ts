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
