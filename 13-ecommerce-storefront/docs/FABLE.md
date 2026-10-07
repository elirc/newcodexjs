# FABLE Guide — E-Commerce Storefront

**Project 13: the transaction becomes the product.** A storefront looks like CRUD with
nicer CSS, but three problems here are qualitatively harder than anything in a task
app: **guest identity** (a cart for someone with no account), **the checkout
transaction** (order + stock deduction + cart clear, atomically), and **two-sided
APIs** (shopper routes and admin routes over the same data). Plus it quietly reuses
half the curriculum: catalog filters (P2), aggregates (P3), stock (P10), reviews (P7's
user content).

---

## 1. What is new in this project

| Pattern | Where it lives | Why it matters |
|---|---|---|
| Guest sessions | `x-session-id` header; client persists a session id in `localStorage` | Identity without auth. The cart belongs to a *browser*, not a user. |
| Cart merge | `POST /api/cart/merge` | The classic flow: guest fills a cart, then logs in — now two carts exist. Merge rules are product decisions encoded in a service. |
| Checkout transaction | `POST /api/checkout` in `storeService.ts` | Create order + order lines, deduct stock, clear cart — one transaction, with stock races handled (Project 10's lab, now load-bearing). |
| Catalog filtering | `GET /api/products` with `category_id`/`min_price`/`max_price`/`min_rating`/`in_stock`/`sort` | Compound filters plus a primary-image join. Rating filters on the denormalized `products.avg_rating` column, which `createReview` recomputes. |
| Two audiences | `/api/products...` vs `/api/admin/...` routes | Same tables, different projections and permissions. `x-demo-user-id` stubs the auth. |
| Slug-based detail + related products | `/products/:slug` | URLs from Project 7's slug lab, in a catalog context. |

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL + Zod validators.
API on **:4113** (`server/src/config/env.ts`), client on :5175 (`client/vite.config.ts`).

## 2. Run it (10 minutes)

```bash
cd 13-ecommerce-storefront/server && cp ../.env.example .env   # fix 5432= to 5432/ in DATABASE_URL, create the DB
npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 13-ecommerce-storefront/client && npm install && npm run dev
```

**Walk the money path by hand — this sequence is the whole project:**

```bash
# 1. browse with filters
curl "http://localhost:4113/api/products?category_id=1&min_price=10&sort=price_asc"
# (or by slug: /api/categories/<slug>/products)

# 2. a GUEST cart — session header, and user id 0 (omitting the user header
#    falls back to DEMO_USER_ID=2, which would select user 2's cart)
curl -X POST http://localhost:4113/api/cart/items \
  -H "content-type: application/json" -H "x-session-id: guest-abc" -H "x-demo-user-id: 0" \
  -d '{"productId":1,"quantity":2}'
curl "http://localhost:4113/api/cart" -H "x-session-id: guest-abc" -H "x-demo-user-id: 0"

# 3. "log in" and merge the guest cart into the user cart
curl -X POST http://localhost:4113/api/cart/merge \
  -H "content-type: application/json" -H "x-demo-user-id: 4" -H "x-session-id: guest-abc" -d '{}'
# (the guest session is read from the x-session-id header, not the body)

# 4. checkout — then immediately re-fetch the product and confirm stock dropped
curl -X POST http://localhost:4113/api/checkout -H "content-type: application/json" \
  -H "x-demo-user-id: 4" -d '{ ...address/payment stub per validator... }'
curl "http://localhost:4113/api/products/<slug>"   # detail is by slug only — check stock_quantity
```

(Read `server/src/validators/storeValidators.ts` for the exact checkout payload.)

## 3. Guided code tour (read in this order)

| # | File | Notice this |
|---|------|-------------|
| 1 | `server/src/routes/storeRoutes.ts` | Map the surface: shopper routes, cart routes (session-scoped), account routes (user-scoped), `/admin/*` routes. Which header does each group require? |
| 2 | `server/src/services/storeService.ts` — checkout | **The centerpiece.** Find the transaction: order insert, line inserts, stock decrement, cart clear. Then answer: how does it reject an order when stock ran out *between* cart-add and checkout? Guarded UPDATE or lock? (You built both in Project 10 Lab 3 — identify which one this is.) |
| 3 | Same file — cart & merge | Merge rules: duplicate product in both carts — sum quantities or keep max? Deleted/out-of-stock product in the guest cart — drop silently or surface? Whatever the code does, write down what *you'd* ship. |
| 4 | `server/src/models/storeModel.ts` — catalog query | The rating filter reads the denormalized `products.avg_rating` column (no review join). Count the queries behind one catalog page (products + count) and check how the primary image is joined. |
| 5 | Admin endpoints (controller/service tail) | Status updates on orders — is there a legal-transition check (Project 9's machine) or can `delivered` jump back to `pending`? |
| 6 | `client/src/App.tsx` + `services/api.ts` | Where the session id is minted and persisted, how it rides on every request, and what happens to it after merge. |

## 4. The challenge ladder

### Level 1 — Junior
1. **Add a "free shipping over X" banner** computed from the cart total — client
   renders it, but the *threshold and math live in the cart response* (server). Why
   server? Because the mobile app next year needs the same number.
2. **Facet counts:** make the category filter show counts (`Electronics (12)`).
   One GROUP BY, cached understanding of Project 3.

### Level 2 — Mid
3. **Break the checkout, prove the rollback:** force a failure after order insert but
   before cart clear (temporarily throw, or make one line's stock insufficient).
   Assert: no order row, no stock change, cart intact. If any survive, you found a
   real bug — fix the transaction boundary.
4. **The oversell race:** two checkouts, same last unit, `Promise.all` (Project 10's
   test harness). Verify exactly one succeeds and the other gets a clean
   "insufficient stock" error the client can render.
5. **Order status machine:** port Project 9's transitions-as-data onto admin order
   status updates (this schema's states: `pending → confirmed → processing → shipped →
   delivered`, `cancelled` from pre-shipment states; checkout inserts `confirmed`), with a 409 on illegal jumps and a status history table.
6. **Review integrity:** only buyers may review (check user's delivered orders for the
   product), one review per user per product (unique index as backstop). Note both
   enforcement points — service check and constraint.

### Level 3 — Senior
7. **Price integrity memo (1 page):** the cart stores product ids and quantities —
   *where does the price come from at checkout?* If the client sends prices, you have
   a security hole; if the current product price is read at checkout, carts change
   price silently; if prices snapshot at cart-add, sales don't apply. What did this
   code do, and what should it do? Include how `order_items.unit_price` protects
   history when products change later.
8. **Guest identity audit:** the session id is a bearer token in `localStorage`.
   What can someone do with a stolen one? Why is that (mostly) acceptable for carts
   and unacceptable for orders? Where must the boundary between session-scoped and
   user-scoped data sit?
9. **Payment provider sketch:** the checkout is mock. Sketch the real Stripe-shaped
   flow: payment intent, webhook confirmation, and the new failure mode — *payment
   succeeded but your DB write failed*. Where does idempotency (an idempotency key on
   checkout) become mandatory rather than nice?

## 5. Questions you should be able to answer afterward

- Why must stock deduction happen inside the checkout transaction rather than after it?
- Cart merge: why is it a POST with explicit semantics rather than "just happens at login"?
- Why do order lines copy `unit_price` (and name?) instead of joining products at read time?
- What data may a session-scoped request touch that a user-scoped request may not, and vice versa?
- Which of the catalog filters can use indexes directly, and which (rating) needs a denormalized column or materialized aggregate to scale?

## 6. Common traps

- **Client-computed totals:** the server must recompute the cart total at checkout; the client's number is a *display*.
- **Session id collisions:** if the client mints ids, use real UUIDs, not `Math.random()` strings.
- **Zombie carts:** guest carts accumulate forever. Note the cleanup strategy (TTL column + sweep) even if you don't build it.
- **Admin routes trusting `x-demo-user-id` without a role check:** find whether *any* user id can hit `/admin/*` here. If yes, that's your reminder of what the stub doesn't do.

Next: Project 14 (`14-appointment-booking`) — the hardest pure-logic domain in the
curriculum: time, timezones, and conflict detection.
