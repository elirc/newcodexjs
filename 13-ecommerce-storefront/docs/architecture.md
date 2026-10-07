# Architecture

E-Commerce Storefront is the first project where one request has to change several tables or none: checkout reads a cart, creates an order, snapshots its lines, decrements stock and empties the cart. This document describes the code as it is; `path:line` references were checked on 2026-10-06.

## Layers

- `client/` is a React 18 Vite app using TypeScript, Axios, React Query and CSS Modules. The whole UI is one file, `client/src/App.tsx` (catalog, cart, checkout, orders, wishlist and admin views), and all HTTP goes through `client/src/services/api.ts`.
- `server/src/routes/storeRoutes.ts` maps endpoints to controllers and attaches Zod validation with `validateBody(...)`.
- `server/src/controllers/storeController.ts` extracts ids, the demo identity headers (`:9-16`), params and bodies. Several controllers run Knex queries **directly** (reviews list, category lookup, address update/delete, admin order status), so the "thin controller" rule is only partly followed.
- `server/src/services/storeService.ts` owns cart quantity rules with stock checks, guest-to-user merge, the checkout transaction, review verification and admin stats.
- `server/src/models/storeModel.ts` contains Knex data access (catalog filters, cart lookup, addresses, orders, wishlist, admin lists).
- `server/src/middleware/` handles Zod validation (`validate.ts`) and the error envelope (`errors.ts`).

## Data model

From `server/db/migrations/001_init.ts`:

| Table (lines) | Key columns and constraints |
|---|---|
| `users` (5-13) | `email` unique, `role` `CHECK` customer/admin (no server code reads it) |
| `categories` (14-21) | `slug` unique, `parent_id` for nesting |
| `products` (22-39) | `slug` and `sku` unique, `price` decimal(10,2), `stock_quantity`, `avg_rating` decimal(2,1), `review_count`, `is_active` |
| `product_images` (40-52) | `is_primary`, `sort_order` |
| `carts` (53-63) | `user_id` unique, `session_id` unique: one cart per user or per guest session |
| `cart_items` (64-81) | unique `(cart_id, product_id)`, `CHECK quantity > 0`, `unit_price` captured when the item is added |
| `addresses` (82-101) | owned by `user_id` |
| `orders` (102-120) | `order_number` unique, `status` `CHECK` of six states, money columns decimal(10,2), `shipping_address` jsonb snapshot, `payment_status` default `paid` |
| `order_items` (121-138) | `product_name`, `unit_price`, `line_total` snapshots |
| `reviews` (139-160) | unique `(product_id, user_id)`, `CHECK rating between 1 and 5`, `is_verified_purchase` |
| `wishlists` (161-176) | per user and product |

## Identity (as implemented)

There is no login. `userId(req)` reads `x-demo-user-id` and falls back to `DEMO_USER_ID` (default 2), and `sessionId(req)` reads `x-session-id` and falls back to `DEMO_SESSION_ID` (`storeController.ts:9-16`, `config/env.ts:10-11`). The client sends both on every request: user `"2"` and a UUID it keeps in `localStorage` under `storefront_session_id` (`client/src/services/api.ts:4-23`).

`getOrCreateCart` picks the **user** cart whenever `userId` is truthy and only falls back to the session cart otherwise (`storeModel.ts:76`). Because `userId(req)` always returns a number, every cart request from the bundled client uses user 2's cart; the guest cart is reached only by sending `x-demo-user-id: 0`. The client never calls `POST /cart/merge`.

No route checks `users.role`. The `/admin/*` routes (`storeRoutes.ts:65-83`) are open to any caller.

## Request trace: checkout (the core write)

1. `App.tsx` calls `checkout.mutate({ addressId: firstAddress.id, shippingMethod: "standard", paymentMethod: "mock_card" })` from the cart panel (mutation at `App.tsx:177-178`).
2. `client/src/services/api.ts:46` posts to `/checkout` with the identity headers from the interceptor.
3. `server/src/app.ts:14-24` parses JSON and rejects non-object bodies; `app.ts:29` mounts the router at `/api`.
4. `storeRoutes.ts:50-54` runs `validateBody(checkoutSchema)` (`validators/storeValidators.ts:10-14`: positive `addressId`, `shippingMethod` in standard/express/free, `paymentMethod` default `mock_card`).
5. `storeController.ts:134-136` calls `service.checkout(userId(req), req.body)` and replies 201.
6. `storeService.ts:134-200` runs one `db.transaction`:
   - address must belong to the user (`:139-142`, 404 otherwise);
   - the cart row is locked (`:144`), then the cart's products are locked in id order (`:146-152`) so two buyers serialize on the same product and cannot deadlock on ordering;
   - cart lines are re-read; an empty cart or an inactive/short product is a 400 (`:153-161`);
   - totals are computed (`:162-166`, `totals()` at `:118-131`), the order is inserted with `status: "confirmed"` and `payment_status: "paid"` (`:167-181`), order lines snapshot `product_name` and `unit_price` (`:182-191`), stock is decremented (`:192-196`) and the cart is emptied (`:197`).
7. Any throw rolls everything back. The tests "two buyers cannot buy the same last unit" (`test/checkout.test.ts:68`) and "double checkout makes one order and late failure preserves cart and stock" (`:96`) pin this behavior.

## Cart persistence

Adding and editing go through `changeCartQuantity` (`storeService.ts:42-76`): one transaction that locks the cart and the product, adds to (or replaces) the existing quantity, rejects totals above `stock_quantity`, and upserts on `(cart_id, product_id)`. The merge endpoint (`storeService.ts:90-115`) copies guest lines into the user cart keeping the larger quantity for duplicates and then deletes the guest lines; it does not re-check stock.

## Senior findings (verified in source)

1. **Admin endpoints have no authorization.** `users.role` exists (`001_init.ts:10-12`) but nothing reads it; any caller can create products, change prices and set order status (`storeRoutes.ts:65-83`). The earlier version of this document called role checks "intentionally small"; there are none.
2. **Checkout charges the price from when the item was added.** Subtotal and order lines use `cart_items.unit_price` (`storeService.ts:162-165`, `:188`), which is set at add time (`:71`, `:74`). If an admin raises or cuts a price, carts keep the old price until the item is re-added. Real shops re-price at checkout and show the change.
3. **The client chooses free shipping.** `shippingMethod: "free"` is an allowed enum value (`storeValidators.ts:12`) and `totals()` sets shipping to 0 for it (`storeService.ts:122`), so any order can skip shipping by asking. Money is also computed in JavaScript floats (`:125-129`) before landing in `decimal(10,2)` columns.
4. **Order numbers can collide.** `orderNumber()` is `ORD-` plus `Date.now()` in base 36 (`utils/http.ts:9-11`) against a unique column (`001_init.ts:104`); two checkouts for different users in the same millisecond produce a unique violation, which the error middleware turns into a 500.

Also: `createReview` updates `avg_rating` with three separate statements outside a transaction (`storeService.ts:203-233`); `GET /products/:slug` for an unknown slug returns 200 with `data: null` (`storeModel.ts:50`); setting an order to `cancelled` (`storeController.ts:215-224`) does not restore stock.

## Debugging scenario

Symptom: a customer adds 2 of a product, an admin lowers its price, and the order total still uses the old price. Path: look at `cart_items.unit_price` for that cart (`SELECT product_id, quantity, unit_price FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = 2);`) and compare with `products.price`. The checkout sum at `storeService.ts:162-165` reads `item.unit_price`, the cart column, not `item.product.price`. Re-adding the item refreshes it because the upsert merges `unit_price: product.price` (`:74`). Decide whether the fix is "always use current price" or "use current price and tell the user it changed".

## Exercise ladder (junior to mid)

1. **Goal:** confirm the guest cart is unreachable from the UI. **Check:** `client/src/services/api.ts:20` always sets `x-demo-user-id` to `"2"`, and `storeModel.ts:76` prefers `user_id` when it is truthy; `grep -rn "merge" client/src` finds no caller of `/cart/merge`.
2. **Goal:** find every place that writes money. **Check:** list `totals()` (`storeService.ts:118-131`), the order insert (`:167-181`) and the line insert (`:182-191`); note which values are rounded with `toFixed(2)` and which are not (`subtotal`, `line_total`).
3. **Goal:** gate admin routes. **Check:** a middleware loads the user by `userId(req)` and returns 403 unless `role = 'admin'`; a new test calling `POST /api/admin/products` as a customer expects 403. Run locally (needs Postgres): `npm test` with `ASTRA_TEST_DATABASE_URL` set to an `astra_test_*` database (`test/database.ts`).
4. **Goal:** re-price at checkout. **Check:** the subtotal uses `item.product.price`, the response or a 409 reports changed prices, and a test that changes the product price between add and checkout asserts the new price on `order_items.unit_price`.
5. **Goal:** remove the order-number collision. **Check:** `order_number` is derived from the inserted id or a sequence, and a test that stubs `Date.now` to return the same value for two checkouts by different users gets two distinct numbers.

## Tradeoffs

Payments are mocked: every order is inserted as `payment_status: "paid"` with no payment step. The frontend is a dense single-screen learning UI in `App.tsx` instead of separate route files, so the whole commerce flow stays easy to read.
