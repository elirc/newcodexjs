# FABLE Guide — REST API Testing Tool (Postman-lite)

**Project 15: build the tool, understand the trade.** You've curl'd every project so
far; now you build the thing that replaces curl: collections of saved requests,
environments with `{{variable}}` interpolation, request history, a response viewer —
and the piece that makes it interesting: a **backend proxy** that executes arbitrary
user-specified HTTP requests, because the browser's CORS rules won't let the client
do it directly. Developer tools are a distinct engineering genre (your user is a
developer, your data is *requests themselves*), and the proxy is a security problem
wearing a feature's clothes.

---

## 1. What is new in this project

| Pattern | Where it lives | Why it matters |
|---|---|---|
| The proxy | `services/proxyService.ts`, `controllers/proxyController.ts` | Your server executes requests to URLs users typed. Timing, size, status capture — and SSRF risk, for real this time (Project 6's Lab 3 warned you). |
| Why a proxy at all | client can't fetch cross-origin | Being able to *explain CORS from both sides* — as the blocked client and as the API that sets the headers — is a permanent interview asset. |
| Template interpolation | `utils/interpolate.ts` | `{{baseUrl}}/users/{{id}}` — a tiny template engine: resolution order, missing variables, no infinite recursion. |
| Environments | environment model/service/controller | Named variable sets with one active — the mental model behind every deploy config system. |
| Trees in UI | collections → folders (one level) → requests, `CollectionTree.tsx` | Persisted tree with sort fields; import/export/duplicate of nested structures (Project 11's deep-copy again). |
| History as a log | history model + pagination + clear | Append-only request log with retention questions — a mini ledger (Project 10) for requests. |
| CodeMirror integration | `client/src/components/ui/CodeEditor.tsx` | Wiring a serious third-party editor widget into React — controlled-component friction included. |

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL + Zod + CodeMirror.
API on **:4215**, client on **:5175**. DB: `api_tester`.

## 2. Run it (10 minutes)

```bash
createdb api_tester
cd 15-api-tester/server && cp .env.example .env
npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 15-api-tester/client && cp .env.example .env 2>/dev/null; npm install && npm run dev
```

**Best first session: point the tool at your own earlier projects.** Start Project 1's
API, then in the three-panel UI create an environment `{"baseUrl":"http://localhost:4000/api"}`,
save a request `GET {{baseUrl}}/tasks`, send it, check the timing/size readout, and
find the entry in History. You are now dogfooding — every annoyance you feel is a lab.

```bash
# the proxy is itself an API — drive it raw:
curl -X POST http://localhost:4215/api/proxy -H "content-type: application/json" \
  -d '{"method":"GET","url":"http://localhost:4000/api/tasks","headers":{}}'
```

## 3. Guided code tour (read in this order)

| # | File | Notice this |
|---|------|-------------|
| 1 | `server/src/services/proxyService.ts` | The core: build the outbound request, time it, capture status/headers/body/size, log to history. Hunt for the guards — timeout? max body size? blocked hosts/protocols? Every missing guard goes on your Lab 3 list. |
| 2 | `server/src/utils/interpolate.ts` | The whole template engine. What happens on `{{missing}}`? On a variable whose *value* contains `{{other}}`? Nested resolution is where naive implementations loop forever. |
| 3 | `server/src/validators/schemas.ts` | One file schemas the whole domain — method enums, URL rules, header shapes. Compare its URL validation strictness against what the proxy will actually be handed. |
| 4 | Collection service/model | The tree: one-level folders + sort fields. How does duplicate/import remap ids (Project 11's deep-copy problem)? What stops a folder inside a folder? |
| 5 | `server/src/services/historyService.ts` | Pagination over an append-only table; what's stored per entry (the response body too? size limits?). |
| 6 | `client/src/App.tsx` + the three panels | Layout state vs. data state: selected request, unsaved edits, response in flight. Where does an *unsaved* request live while you edit it? |
| 7 | `client/src/components/ui/CodeEditor.tsx` | CodeMirror as a controlled-ish component: how value/onChange bridge to editor transactions without cursor jumps. |

## 4. Trace this flow

**"Send" with variables:** click Send → client resolves nothing (check!) → request
def + active environment go to the server → `interpolate.ts` substitutes into URL,
headers, body → proxy executes with timing → response captured → history row written →
client renders status, time, size, pretty-printed body.
Question to settle by reading: **where** does interpolation happen — client, server,
or both? What's the argument for server-side (history stores what was *actually*
sent... or does it store the template)? Check what history stores; that decision has
a security angle (secrets in variables) worth writing down.

## 5. The challenge ladder

### Level 1 — Junior
1. **cURL export:** a button that renders any saved request (interpolated) as a
   copy-pasteable `curl` command. String-building with correct escaping — humbler and
   more instructive than it sounds.
2. **Missing-variable UX:** send a request using `{{undefined_var}}`. Whatever happens
   now, make it a clear pre-send error naming the variable — in *both* the UI and the
   proxy's validation.

### Level 2 — Mid
3. **Response viewer upgrades:** header table, raw/pretty toggle, and content-type
   awareness (JSON pretty-printed via CodeMirror, HTML shown as text — NOT rendered;
   say why, citing Project 7).
4. **Request timeout + cancel:** an `AbortController` on the proxy's outbound call
   (server) and a Cancel button (client) that aborts the in-flight proxy request.
   Two abort layers, one UX.
5. **History retention:** cap history at N entries per user or T days — a delete
   strategy that runs on write (or a sweep) without table-scanning every request.
   Decide: does clearing history make the tool *lie* about what it sent? (Audit-log
   instincts from Project 10 apply.)

### Level 3 — Senior
6. **SSRF hardening (implement, don't just memo):** the proxy will fetch anything —
   including `http://localhost:4215/api/...` (itself!), cloud metadata endpoints
   (`169.254.169.254`), and your Postgres port. Build the guard: protocol allow-list
   (http/https), resolve DNS *then* check the IP against private ranges (the
   DNS-rebinding footnote: re-resolution between check and fetch), redirect policy
   (re-check every hop), response size cap. Then the memo: why "it's a local dev tool"
   is and isn't a valid reason to skip all this — what changes the day it's hosted?
7. **Secrets in environments:** a `token` variable is a credential sitting in
   Postgres plaintext and in every history row that used it. Design the fix tiers:
   masked display, secret-typed variables excluded from history, encryption at rest —
   and what each protects against, honestly.
8. **Import/export compatibility memo (1 page):** design your export format v1 with a
   version field, then spec how you'd import a *Postman* collection (their schema is
   public). The general lesson: interop formats are APIs you can never break —
   Project 6's versioning lab, applied to files.

## 6. Questions you should be able to answer afterward

- Explain, both directions, why the browser blocks the client from calling `http://localhost:4000` directly but your server can — what threat model is CORS actually for? (Hint: it protects the *target's* users, not you.)
- Why must interpolation depth be bounded, and what input makes an unbounded implementation hang?
- What's the difference between the proxy timing out and the *target* returning slowly — and how does your history row distinguish them?
- Where do unsaved edits live in the client, and what happens when the user switches requests with dirty state? (Same dirty-state contract as Project 4's autosave.)
- Name three requests the proxy must refuse even though a user legitimately typed them.

## 7. Common traps

- **Forwarding all client headers to the target:** the browser's cookies/origin headers leak into proxied requests. Build the outbound header set explicitly; never spread `req.headers`.
- **Storing unbounded response bodies in history:** one 200MB response ruins the table. Cap and truncate, note the truncation in the row.
- **Interpolating into JSON bodies by string-replace** can produce invalid JSON when values contain quotes. Decide: substitute-then-parse, or parse-then-substitute-into-values?
- **CodeMirror re-created every render:** the editor must be initialized once and updated via transactions, or typing lags and cursor position resets — the classic heavy-widget-in-React lesson.

Next: Projects 16–20 — five "enterprise scaffold" apps sharing one production-pattern
kit (soft delete, audit logs, saved views, bulk ops). Read one deeply, then use the
other four as build-labs for their domains.
