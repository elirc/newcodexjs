# FABLE Guide — Real-Time Chat Platform

**Project 19: operate a chat platform, then make it actually real-time.** Two guides
converge here. From Project 16 you bring the enterprise kit (this scaffold shares it:
soft delete, audit, request context, saved views, bulk ops — **read 16's FABLE guide
first**). From Project 12 you bring the chat mechanics (polling, cursors, presence —
its FABLE guide is the other prerequisite). This project's scaffold models the
**operational layer** — workspace-scoped `conversations` with statuses
`active/muted/incident/archived`, comments usable as moderation notes, bulk status
changes (archive/mute), and audit for moderation events. Despite the name, there are
no messages, members or sockets in this codebase yet, and `muted`/`incident` are
labels with no effect. The labs first make you the *platform operator*, then hand you
the upgrade Project 12 deliberately withheld: **WebSockets**.

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL. API on **:4119**.

## 1. Run it (10 minutes)

```bash
# the server loads ../.env (relative to server/), i.e. a project-root .env:
cd 19-realtime-chat-platform && cp .env.example .env   # create the DB_NAME it names
cd server && npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 19-realtime-chat-platform/client && npm install && npm run dev
```

```bash
curl "http://localhost:4119/api/conversations?status=active"
curl "http://localhost:4119/api/conversations/dashboard"
# moderation: mute a conversation, verify the audit trail names you
curl -X POST http://localhost:4119/api/conversations/bulk/status -H "content-type: application/json" \
  -H "x-demo-user: you@example.com" -H "x-demo-role: operator" -d '{"ids":[1],"status":"muted"}'
curl "http://localhost:4119/api/conversations/audit?limit=5"
```

**Orientation pass (30 min):** diff `services/service.ts` / `models/model.ts` against
Project 16's; note the domain deltas (status enum, moderation framing). Then
`docs/journal.md`.

## 2. What this domain teaches

1. **Moderation is state + evidence.** `muted` and `incident` aren't UI decorations —
   they must *do* something to message flow (Lab 2), and every moderation act needs
   an audit row an ops team could defend later. This is why the kit's audit log and
   the chat domain belong together.
2. **The operator view ≠ the member view.** Project 12 was built from the chat
   *member's* seat; this scaffold is the *trust & safety dashboard* seat. Keeping
   those APIs separate — different projections, different permissions — is P17's
   customer-view lesson at platform scale.
3. **Real-time is an upgrade, not a rewrite.** Because P12's polling design used
   cursors, moving to sockets is additive. That's the payoff of good transport-neutral
   design, and you're about to collect it.

## 3. The challenge ladder

### Level 1 — Junior
1. **Moderation views:** saved views for "Active incidents," "Muted this week,"
   "High-priority workspaces," rendered as one-click tabs (the P16/P17 saved-views
   loop, third repetition — it should take under an hour now; that speed is the point).
2. **Status machine with teeth:** transitions-as-data for
   `active ↔ muted`, `active → incident → active/archived`, illegal jumps 409, and a
   required reason comment on every entry *into* `muted` or `incident` (mirrors P18's
   rejection-comment rule).

### Level 2 — Mid
3. **Bring the messages:** port Project 12's message/membership tables and endpoints
   into this app (schema + routes + service; adapt, don't copy blindly — this
   scaffold's context middleware and soft-delete conventions must apply to messages
   too). Now `muted` can mean something: members can read but not post; `incident`
   freezes posting for everyone but operators. Enforce in the service, prove with
   curl as three different actors.
4. **WebSocket layer (the headline lab):** add `ws` or `socket.io` to the Express
   server. Design first, then build:
   - Socket auth handshake (the demo-header identity, passed at connection time).
   - Rooms per conversation; broadcast on new message.
   - **Keep the HTTP POST as the write path** (socket = fan-out, HTTP = mutation) —
     argue this choice against socket-writes in a comment; it preserves validation,
     audit, and the P12 fallback.
   - Client: this app's client has no poll loop (it re-fetches after each action);
     add a socket subscription *plus* cursor backfill on connect/reconnect
     (`?after=` — Project 12's cursor pays off exactly here).
5. **Presence, socket edition:** connection open = online, close = offline — but
   multiple tabs mean N connections per user, so presence is a *count*, and a dropped
   connection without close needs heartbeat/ping timeout anyway. Compare honestly
   with P12's HTTP heartbeat: what actually improved?

### Level 3 — Senior
6. **The two-server problem (1 page + prototype if ambitious):** run two instances of
   the server; a message posted to instance A must reach a socket connected to
   instance B. Design the pub/sub bridge (Redis pub/sub or Postgres LISTEN/NOTIFY —
   prototype the latter, it's already in your stack), and cover reconnect storms,
   message ordering across the bridge, and what "delivered" may honestly mean now.
   This is *the* system-design interview question for chat, and you'll have built it.
7. **Moderation at write-time:** where does a "muted conversation rejects posts" check
   live once writes can arrive via HTTP *and* (if you chose socket-writes) sockets?
   Generalize: any rule enforced per-transport is a bug factory — extract the single
   write path and diagram it.

## 4. Questions you should be able to answer afterward

- Why keep HTTP as the mutation path and use sockets only for fan-out? Name the three things you'd otherwise reimplement in the socket layer (validation, auth context, audit).
- What does cursor backfill on reconnect solve that "just resubscribe" doesn't? (Missed messages during the gap — the at-least-once story.)
- Why is presence-by-connection-count still not truthful, and what timeout logic papers over it?
- LISTEN/NOTIFY vs. Redis pub/sub for the two-server bridge: payload limits, delivery guarantees, operational cost — when is the Postgres answer genuinely enough?
- What belongs in the *moderation* audit log vs. the message store, and who is each answering to?

## 5. Common traps

- **Socket handlers bypassing the service layer:** the moment a socket handler writes to the DB directly, every rule in `service.ts` has a hole. One write path.
- **Broadcast before commit:** emit after the transaction commits, or clients render messages that then fail to persist (the optimistic-UI ghost, server-side).
- **Reconnect without backoff:** a server restart makes every client reconnect simultaneously; jittered backoff is two lines that prevent a self-inflicted stampede.
- **Sticky-session assumptions:** if instance A holds the socket, don't let any code assume it also handled the HTTP write. The two-server problem starts on day one, not at scale.

Next: Project 20 (`20-marketplace-platform`) — the capstone: the kit meets commerce,
moderation, and money, composing Projects 10, 13, and 16.
