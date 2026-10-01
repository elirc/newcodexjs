# Solutions and engineering review

[Course index](README.md) · [Practice prompts](05-PRACTICE.md)

Attempt each exercise before using these notes. These are solution approaches and review criteria, not claims that every extension has been implemented. The actual completed behavior is described in the worked-change chapter.

## Existing implementation

A shared route guard verifies the demo user's membership for conversation/message operations, restricts group management to admins and validates read-receipt references. Group creation deduplicates members.

The key model is: Users join conversations through conversation_members, whose role is admin/member. Messages reference a conversation and author. Reactions reference a message and user. Read receipts store last_read_message_id on membership rows; typing indicators also reference conversation/user.

The worked fixture should behave as follows: User 3 cannot read or poll the study room, react to its messages, type there or add members. User 2 can read and react but cannot manage members. A receipt pointing to another room is rejected. The author can edit/delete a message; a deleted message cannot be revived by editing.

## Extension solutions

### Exercise 1

**Prompt:** Add clear UI feedback when access to an open conversation is removed.

**Approach:** Stop the polling loop after the access error, clear protected content and show a way to choose another conversation.

**Review:** the feedback must be driven by the server: when the polling query or `getMessages` returns the guard's 404, the room must switch to a "you no longer have access" state and stop polling (`enabled: false` or `refetchInterval` off); a client test should mock the 404 and assert the state and that no further poll request is issued.

### Exercise 2

**Prompt:** Add a member-role badge that reflects the conversation membership.

**Approach:** Read role from the current conversation's member list, never from a globally cached label.

**Review:** the badge must come from the `role` in the membership rows the server returns, never from local assumptions; when an admin demotes a member the badge must change on the next poll; assert with a server test that `listMembers` exposes `role` and a client test that the badge re-renders after the query refetches.

### Exercise 3

**Prompt:** Test polling after removing a user from a group.

**Approach:** Read successfully, remove membership as admin, then poll with the removed user and assert 404 with no private message payload.

**Review:** insert user 2's membership, open a poll cursor, remove the membership via the admin route, then poll again: the response must be 404 and the unread count for user 2 must not change; explain that the guard re-checks membership on every request, which is exactly why polling (not a long-lived socket) makes removal take effect within one interval.

### Exercise 4

**Prompt:** Replace demo headers with signed-in user identity.

**Approach:** Populate user identity from verified sessions and retain the membership guard. Authentication and authorization remain different responsibilities.

**Review:** the design must replace `x-demo-user-id` with a server-issued session (cookie or bearer), keep the guard's membership lookup unchanged (only `user` comes from the session now), and state what happens to the `DEMO_USER_ID` fallback (delete it: a missing session must be 401, not a silent default user).

### Exercise 7 — make the TOCTOU window visible

Reference hook and test:

```typescript
// chatRoutes.ts (top level)
export const hooks: { afterGuard?: () => Promise<void> } = {};
// last lines of the guard, before next():
await hooks.afterGuard?.();
next();
```

```typescript
test("membership removed between guard and handler", async () => {
  const { hooks } = await import("../server/src/routes/chatRoutes.js");
  hooks.afterGuard = async () => {
    await h.db("conversation_members").where({ conversation_id: room, user_id: 2 }).delete();
  };
  try {
    const r = await api(`/conversations/${room}/messages`, "GET", undefined, 2);
    console.log("status after removal inside the window:", r.status); // 200 before the fix in step 4
  } finally {
    hooks.afterGuard = undefined;
    await h.db("conversation_members").insert({ conversation_id: room, user_id: 2, role: "member" });
  }
});
```

Review: the point is not to eliminate every window (a read that started while you were a member is arguably fine) but to know where the check happens relative to the read, and to move the check into the query for writes that must not succeed for a non-member (sending a message, reacting). Explain which routes you would harden and why.

### Exercise 8 — unread counts and cursors, by the numbers

Answers: unread is `count(*) WHERE conversation_id = ? AND id > last_read_message_id AND NOT is_deleted` (check the model for the exact predicate; if `is_deleted` is not in it, that is a finding to fix and test). `listMessagesAfter(room, 10)` is `WHERE id > 10 ORDER BY id ASC LIMIT 100`, so 11 and 12. `listMessages(room, 12)` is `WHERE id < 12 ORDER BY id DESC LIMIT 30`, then reversed, so ... 10, 11 oldest-first. After reading 12, unread is 0 and `?after=12` is empty. The cursor is an id, not a timestamp, because ids are assigned once and never collide, while two messages can share a `created_at`.

Review: show the table with predictions and observations side by side; any mismatch must be explained by pointing at the SQL that produced it.

## Review questions with answer guidance

**Why not trust input just because it came from this UI?** A caller can bypass the UI, a saved file can be edited, and older data can have a different shape. Validate at the boundary that owns the operation.

**Why keep the id stable?** It identifies the same domain record across views and edits. Changing it can create duplicates, disconnect child records or make reconciliation impossible.

**What makes the failure test meaningful?** It observes the promised state invariant. For this project, explain exactly why the failing scenario in [test/membership.test.ts](../test/membership.test.ts) would detect the original or a plausible regression.

**What does the test not prove?** A bounded suite does not prove all concurrency, browsers, deployment configurations or unrelated domain behavior. Name the real limitation from this lesson instead of adding a generic disclaimer.

**When should you extract a helper?** When it isolates a coherent responsibility, makes an invariant clearer or enables a meaningful test without duplicating application logic. A pure validator and a shared persistence boundary are common examples, but do not abstract solely to increase the number of files.

## A sample change explanation

“The previous behavior was: History, polling, reactions and group-management routes did not consistently verify membership. A duplicate member ID could break group creation. I changed the implementation so that: A shared route guard verifies the demo user's membership for conversation/message operations, restricts group management to admins and validates read-receipt references. Group creation deduplicates members. The strongest evidence is the regression that exercises the worked fixture and checks authoritative state. A remaining design question is the final stretch exercise.”

Replace that explanation with your own words and actual test results. A strong junior engineer can connect a concrete user problem to code, verification and a clearly stated limit. Completing that explanation independently is the final checkpoint for this course.
