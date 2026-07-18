# FABLE Guide — Recipe Manager with User Accounts

**Project 5: the biggest single jump in the curriculum.** Three new dimensions land at
once: **TypeScript** end-to-end, **JWT authentication** (access token + HTTP-only
refresh cookie), and **multi-table writes in a transaction**. Plus the concept that
reshapes every layer: requests now have an *identity*, and some data has an *owner*.

Budget more time here than for Projects 1–4 combined. It's worth it — auth + ownership
+ transactions is the exact skill set the industry means by "mid-level backend."

---

## 1. What is new in this project

| Pattern | Where it lives | Why it matters |
|---|---|---|
| TypeScript everywhere | `server/src/**/*.ts`, `client/src/**/*.tsx`, shared shapes in `server/src/types/domain.ts` and `client/src/types/recipe.ts` | Types are the contract between layers; watch how they replace guesswork. |
| JWT access + refresh | `services/authService.ts`, `middleware/auth.ts` | Short-lived bearer token in memory, long-lived refresh token in an HTTP-only cookie. Learn *why the split exists*. |
| Route protection, two flavors | `middleware/auth.ts`: `requireAuth` vs. `optionalAuth` | Public browsing works logged-out; favorites/ownership light up when logged in. Read both — the asymmetry is the lesson. |
| Ownership checks | `recipeService.ts` update/delete paths | 403 vs. 404 vs. 401 — three different "no" answers, each meaning something. |
| Knex transactions | recipe create: recipe + ingredients + steps + categories in **one transaction** | Partial writes are corruption. This is the pattern Projects 9–10 build on. |
| React auth context | `client/src/context/AuthContext.tsx` + `services/api.ts` | Login state as app-wide context; token installed via `setAccessToken()`; `withCredentials: true` carries the refresh cookie. |
| Password hashing | `authService.ts` + `models/userModel.ts` | bcrypt, and why the users table must never leak `password_hash` in responses. |

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL + jsonwebtoken + bcrypt.
API on **:4005**, client on **:5175**.

---

## 2. Run it (10 minutes)

```bash
createdb recipe_manager
cd 05-recipe-manager/server && cp .env.example .env   # includes JWT secrets
npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 05-recipe-manager/client && npm install && npm run dev
```

Seeded logins (password `password123`): `maya@example.com`, `leo@example.com`, `sam@example.com`.

**Walk the auth lifecycle by hand before reading code** — this sequence *is* the mental model:

```bash
# 1. login → note the accessToken in the body AND the Set-Cookie refresh token
curl -i -X POST http://localhost:4005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"maya@example.com","password":"password123"}'

# 2. protected route without a token → 401
curl -i http://localhost:4005/api/recipes/mine

# 3. same route with the token → 200
curl -i http://localhost:4005/api/recipes/mine -H "Authorization: Bearer <accessToken>"

# 4. public browsing needs nothing
curl "http://localhost:4005/api/recipes?search=noodle"
```

---

## 3. Guided code tour (read in this order)

| # | File | Notice this |
|---|------|-------------|
| 1 | `server/src/types/domain.ts` | Read the types first — they're the map of the whole domain. |
| 2 | `server/src/middleware/auth.ts` | ~35 lines that carry the whole security model. `requireAuth` throws `UnauthorizedError`; `optionalAuth` swallows bad tokens and continues. Ask: why is swallowing correct there and wrong in `requireAuth`? |
| 3 | `server/src/services/authService.ts` | Register (bcrypt hash), login (compare), refresh (rotate?), logout. Find the access-token TTL and the refresh TTL; the ratio between them is the design. |
| 4 | `server/src/routes/recipeRoutes.ts` | Which routes get `requireAuth`, which get `optionalAuth`, which get nothing. The router is the security *policy document*. |
| 5 | `server/src/services/recipeService.ts` | Two things: the **ownership check** on update/delete, and the **transaction** on create. For the transaction, trace what happens if inserting step 3 of 5 throws. |
| 6 | `server/src/models/recipeModel.ts` + `userModel.ts` | How the model keeps `password_hash` out of returned columns, and how nested reads (recipe + ingredients + steps) are assembled. |
| 7 | `server/src/types/express.d.ts` | How `req.user` becomes type-safe — declaration merging. Small file, very transferable trick. |
| 8 | `client/src/services/api.ts` | 13 lines: `withCredentials: true` (cookie travels) + `setAccessToken` (bearer header). The client's entire auth plumbing. |
| 9 | `client/src/context/AuthContext.tsx` | Where the access token lives (memory, not localStorage — figure out why), how refresh-on-load restores a session, how logout tears it down. |
| 10 | `client/src/pages/` | `AuthPages`, `CreateRecipePage`, `MyRecipesPage` — note how pages gate on auth context rather than checking tokens themselves. |

---

## 4. Trace these two flows

**Silent session restore:** you reload the page. The access token (memory) is gone,
but the refresh cookie survives. Trace: app mounts → `AuthContext` calls refresh →
cookie rides along via `withCredentials` → server verifies refresh token → new access
token returned → `setAccessToken` installs it → user is "still logged in."
Now answer: *what does the user see if the refresh token is expired, and where is that
handled?*

**Owner-only delete:** log in as `maya`, try deleting `leo`'s recipe (use curl with
maya's token and leo's recipe id). Trace where it's rejected and with which status.
Then argue the senior question: should a non-owner get **403** ("exists, not yours")
or **404** ("nothing to see")? What does each leak?

---

## 5. The challenge ladder

### Level 1 — Junior
1. **Add `prep_time_minutes` to recipes** end-to-end: migration, domain type, service
   validation, model, client type, form field. Count how many files TypeScript *forces*
   you to update — that friction is the feature.
2. **Break auth on purpose:** change one character of `JWT_ACCESS_SECRET` in `.env`,
   restart, and narrate exactly which requests fail, with which status, and why the
   refresh flow can't fix it.

### Level 2 — Mid
3. **Refresh-token rotation:** on every refresh, invalidate the old refresh token and
   issue a new one (requires persisting token ids or a token version per user). Explain
   what attack rotation mitigates (stolen-cookie replay) and what UX it risks
   (two tabs refreshing simultaneously).
4. **Axios 401 interceptor:** when a request 401s, automatically call refresh once and
   retry the original request; queue concurrent 401s behind a single refresh. This is
   the canonical "mid-level frontend auth" exercise — the current code installs the
   token but does not auto-recover.
5. **Test the transaction:** write a test that makes ingredient insertion fail mid-create
   (bad data or a mocked throw) and asserts *zero* recipe rows were committed.

### Level 3 — Senior
6. **Threat-model memo (1 page):** where does this app's design stand on XSS stealing
   tokens (access token in memory vs. localStorage), CSRF (does the refresh cookie need
   `SameSite`? does any state-changing route trust cookies alone? — re-read
   `getToken()`'s cookie fallback in `middleware/auth.ts` with suspicion), and logout
   actually invalidating anything server-side.
7. **Authorization architecture:** ownership checks live in `recipeService`. Propose
   where role-based rules (admin, moderator) would go as they multiply — middleware,
   service guards, or a policy layer — and the cost of each. Projects 16–17 make you
   live with this decision.
8. **Sessions vs. JWT (1 page):** argue when plain server-side sessions would have been
   the *simpler and safer* choice for this exact app, and what JWT buys only at scale
   or across services.

---

## 6. Questions you should be able to answer afterward

- Why two tokens? What exactly does the short access-token TTL limit, and what does the refresh token's HTTP-only flag prevent?
- Why does `optionalAuth` exist instead of making everything `requireAuth` with public exceptions?
- What guarantees does a Knex transaction give here, and what happens to the connection if you forget to await inside it?
- 401 vs. 403 vs. 404 — give a concrete route in this app for each.
- Why does `bcrypt.compare` take ~100ms, and why is that slowness the point?
- What does `withCredentials: true` change about a request, and what must CORS on the server allow for it to work?

## 7. Common traps

- **Cookie without CORS credentials:** if `withCredentials` or the server's
  `Access-Control-Allow-Credentials` is missing, refresh silently fails only in the
  browser — curl works fine. Debug with the network tab, not console.log.
- **`.js` extensions in TS imports** (`from '../config/env.js'`): required by Node ESM
  even in `.ts` files. It looks wrong; it isn't.
- **Seeding hashed passwords:** seeds must store bcrypt hashes, not plaintext. If login
  fails for seeded users after you edit seeds, this is why.
- **Transactions that don't pass `trx`:** every query inside `knex.transaction(async trx => ...)`
  must use `trx`, not `db` — using `db` silently escapes the transaction.

Next: Projects 6–10 are lean scaffolds like Project 4 — each is a build-lab for one
theme (Zod, sanitization, drag-and-drop, state machines, audit trails). With Projects
1–5 internalized, you now extend instead of read.
