# Concepts explained from first principles

[Course index](README.md)

## The central idea: membership predicates and shared route guards

A foreign key proves that a referenced row exists, not that the caller is allowed to see it. The route guard resolves a message to its conversation and checks the membership pair (conversation_id,user_id). This covers GET history, GET polling, POST reactions and metadata operations with the same rule. Owner checks still decide who may edit a particular message.

A read receipt is not merely any existing message ID. It must belong to the conversation being marked read, or unread calculations become misleading. An administrator role is likewise scoped to the membership row for that conversation; being an admin in another group grants nothing here. The x-demo-user-id header is still freely chosen in this educational app, so this demonstrates authorization structure without providing real authentication.

Polling retrieves messages after a cursor. Membership must be checked on every poll, not only when the UI first opens a room, because membership can change. This central check is a useful boundary, but it is not a transaction spanning every subsequent read; strict coordination with simultaneous membership removal would need additional policy and locking.

## Invariants: a precise way to describe correctness

An invariant is a rule that must remain true before and after an operation. “The app works” is too broad to test. “A failed import writes no records” or “editing preserves the record id” gives you something observable. For this project, derive your invariants from this behavior:

> A shared route guard verifies the demo user's membership for conversation/message operations, restricts group management to admins and validates read-receipt references. Group creation deduplicates members.

Turn each sentence into a small state table. The columns are initial state, input, expected final state and expected feedback. Include one rejected input and one retry/repeated action where relevant. A useful invariant should be meaningful even if the implementation changes from an array to a database or from one UI component to another.

## Validation versus normalization

Validation rejects values the operation cannot accept. Normalization converts acceptable values to the representation the rest of the program expects. Trimming a comparison string is normalization; rejecting an empty required field is validation. Neither operation should silently invent facts. If a quantity is free-form text, do not guess a numerical interpretation. If an imported record is malformed, do not quietly save only the convenient subset unless that is the explicit product policy.

Apply this distinction to the data model:

Users join conversations through conversation_members, whose role is admin/member. Messages reference a conversation and author. Reactions reference a message and user. Read receipts store last_read_message_id on membership rows; typing indicators also reference conversation/user.

Which fields can be omitted? Which can be empty? Which have a bounded vocabulary? Which have stable identity? Write those answers down before adding another conditional. A schema is simply an explicit description of that expected shape and meaning.

## State transitions and failure boundaries

Every change has an ordering. If memory changes first and persistence fails, the UI can show data that will disappear after reload. If persistence succeeds first and rendering fails, the stored data may be correct while the screen is stale. There is no universal answer for every feature, but the choice must be deliberate and observable. The worked change makes one specific promise; the tests check that promise.

A promise represents an operation that completes later. `await` does not make it infallible or atomic; it gives the caller a place to handle success and rejection. Similarly, calling several functions inside one `try` block does not create a database transaction. Atomicity must come from a storage operation or transaction boundary that actually provides it.

## Identity, representation and derived values

Keep a stable id when updating an existing record. Compute display-only values from authoritative data when feasible, so there are fewer independently mutable facts to keep synchronized. Be careful when converting between strings and numbers: `Number('')` is zero, JSON cannot faithfully represent Infinity, and a date string can have different semantics from a timestamp. The specific conversions in this lesson are visible in the worked source, so step through them with a concrete value.

## Small design decisions deserve explanations

Before extracting a new abstraction, explain what repeated responsibility it would own. A helper that merely renames one expression may add little. A pure validator or one transaction boundary can make an important guarantee easier to test. Prefer an explanation tied to this project’s behavior over a rule such as “all code must use a particular pattern.”

Write a short decision note: “We chose X because it preserves Y under Z. It does not yet solve W.” Use the limitations in the worked example to fill in those letters. This is the beginning of engineering judgment: choosing a bounded solution and accurately describing its limits.

## One guard for every route: what the path regex buys and costs

`chatRouter.use` at the top of `server/src/routes/chatRoutes.ts` runs before every handler. It reads the demo user, matches `/^\/(conversations|messages)\/(\d+)(?:\/|$)/` against the path, resolves the conversation (directly, or through the message's `conversation_id`), and refuses non-members with a 404 that does not reveal whether the conversation exists. Two extra rules ride on the same match: group management (`PUT /conversations/:id` and anything containing `/members`) needs `role = 'admin'`, and a read receipt must reference a message from this conversation.

What that buys: a new route under `/conversations/:id/...` is protected the moment it is added; nobody can forget the membership check. What it costs: dispatch by string matching. `req.path.includes("/members")` would also match a future `/conversations/7/membership-history`, silently demanding admin; and the guard cannot express per-route differences (a read receipt needs a member, a rename needs an admin, a message edit needs the author) except by more string tests. The read-receipt branch is a good example of the trade-off: it runs before `validateBody(readSchema)`, so it had to grow its own `messageId` check.

The per-route alternative looks like this:

```typescript
const requireMember = (idFrom: (req: Request) => number) => wrap(async (req, _res, next) => { /* membership lookup */ next(); });
const requireAdmin = (idFrom: (req: Request) => number) => wrap(async (req, _res, next) => { /* membership + role */ next(); });
chatRouter.put("/conversations/:id", requireAdmin(paramId), validateBody(groupUpdateSchema), wrap(controller.updateGroup));
chatRouter.post("/conversations/:id/read", requireMember(paramId), validateBody(readSchema), wrap(controller.markRead));
```

Predict before reading exercise 7: which of the two designs makes it easier to forget a check, and which makes it easier to over-match?

