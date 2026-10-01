# Guided and independent practice

[Course index](README.md) · [Solutions](06-SOLUTIONS-AND-REVIEW.md)

## Exercise 0 — reconstruct the existing behavior

Draw the data shape and trace this fixture without running it:

User 3 cannot read or poll the study room, react to its messages, type there or add members. User 2 can read and react but cannot manage members. A receipt pointing to another room is rejected. The author can edit/delete a message; a deleted message cannot be revived by editing.

Write one assertion for success and one for a rejected or failed operation. Then read the existing test and compare its observation with yours. Explain why a message alone would or would not prove the invariant.

## Exercise 1 — guided extension

Add clear UI feedback when access to an open conversation is removed.

Start by locating the current input, handler and output. Write an acceptance example before editing. Make one small change, run the focused tests, and demonstrate it through the same public UI/API a user would use. Add one meaningful regression if the behavior can break in a way the existing suite would miss.

## Exercise 2 — independent variation

Add a member-role badge that reflects the conversation membership.

Close the worked-change chapter while implementing. Describe your design in three sentences: the data you will add or reuse, the rule it must preserve, and the observation that proves it. Compare your answer with the solution only after an independent attempt. If you get stuck, request a hint about the next boundary rather than a complete implementation.

## Exercise 3 — failure-focused extension

Test polling after removing a user from a group.

Create a failing example in a disposable fixture. Capture the state before the operation and after the failure. Identify what must remain unchanged and what feedback the caller needs. A correct result includes understandable recovery behavior, not just throwing an exception.

## Exercise 4 — stretch design

Replace demo headers with signed-in user identity.

Write a short design note before coding. List the current guarantee, the stronger guarantee you want and the new failure modes the change introduces. If this requires a larger architectural change, stop at a concrete proposal and test design until you understand the prerequisite. The earlier exercises should remain understandable and runnable.

## Exercise 5 — teach the codebase

Give a five-minute walkthrough to another learner, or record yourself. Use [server/src/routes/chatRoutes.ts](../server/src/routes/chatRoutes.ts) and one test. Explain the application problem, the data model, the call path, one success case, one failure case and the tradeoff. Ask the listener to predict a new input’s result. Their questions reveal which part of your explanation needs work.

## Exercise 6 — review your own change

Inspect the diff as if you were a teammate encountering it for the first time. Remove unrelated edits. Check names, error feedback, preservation of ids/data, and the order of writes. Update the learning note if the actual code differs from the plan. Record what was tested and what remains an assumption.

## Exercise 7 — make the TOCTOU window visible

The guard checks membership, then the handler runs. Between those two moments the membership row can disappear. The course states this; make it observable.

1. Add a test-only hook in `server/src/routes/chatRoutes.ts`: `export const hooks: { afterGuard?: () => Promise<void> } = {};` and `await hooks.afterGuard?.();` as the last line of the guard before `next()`. It is a no-op in production.
2. In a new test, set `hooks.afterGuard` to a function that deletes user 2's membership row, then as user 2 request `GET /conversations/<room>/messages`. Predict the status before running it.
3. Observe: 200 with the history, even though user 2 is no longer a member when the handler runs.
4. Close the window for the read path only: make the controller's history query join `conversation_members` (`WHERE conversation_id = ? AND EXISTS (SELECT 1 FROM conversation_members WHERE ... user_id = ?)`), and show the same test now returns an empty list or 404. Discuss why the polling design makes the remaining window (one request) acceptable.

## Exercise 8 — unread counts and cursors, by the numbers

Polling and unread badges are pure arithmetic on `messages.id`. Prove you can do it by hand.

1. In the room, insert messages with ids 10, 11, 12 (or read the real ids). Set user 2's `last_read_message_id` to 10 by calling the read route with 10.
2. Predict the unread count the conversation list returns for user 2 (2), what `GET ...?after=10` returns (ids 11 and 12, ascending), and what `getMessages` with `before=12` returns (ids up to 11, newest last).
3. Mark 12 as read and predict both again (0; empty).
4. Now delete message 11 (soft delete). Predict whether the unread count changes and whether `?after=10` still returns it; then read `listMessagesAfter` and `is_deleted` handling to check.

Write your predictions as a small table before running anything.

## Completion rubric

Score each item 0 (cannot explain), 1 (can explain with help) or 2 (independent): data model, control flow, validation, persistence/failure behavior, regression test design, and tradeoff explanation. Aim for 2 on the first five before taking the stretch exercise. Revisit a weak area with a changed-input example rather than rereading every page.
