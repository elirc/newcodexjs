# Worked implementation and examples

[Course index](README.md)

## Before and after

**Before:** Repeated cart additions could exceed stock; checkout read stock without locking, allowing overselling or duplicate orders from concurrent requests.

**After:** Cart additions/edits validate the cumulative quantity under a cart/product lock. Checkout locks the cart and products in ID order, rechecks active stock, then writes order/items, decrements stock and clears the cart atomically.

## Predict this example

With stock 3, adding 2 succeeds but adding another 2 or editing to 4 fails and leaves quantity 2. Two buyers checking out the last unit yield one order. Force an order-item failure: stock and cart remain; retrying normally succeeds.

Before running anything, write the exact expected stored values and visible response. Include ids or record counts where they matter. Then run the focused tests and reproduce the matching UI/API action. Do not settle for seeing a success message: inspect the authoritative stored result as well.

## Actual implementation excerpt

The lines below are the ones Astra changed (compare `AstraOrganized2/astrafinalplan/implementation/batch04/backups/64/server/src/services/storeService.ts` with `diff --strip-trailing-cr -w`): `changeCartQuantity` compares the cumulative quantity against locked stock, and `checkout` locks the cart and then every product in id order before it reads, decides and writes. The linked source is authoritative if you later edit the project.

```typescript
// storeService.ts:42
async function changeCartQuantity(
  userId: number | null,
  sessionId: string | null,
  productId: number,
  quantity: number,
  add: boolean,
) {
  if (!Number.isSafeInteger(quantity) || quantity < 1)
    throw new ValidationError("Quantity must be a positive whole number");
  await db.transaction(async (trx) => {
    const cart = await store.getOrCreateCart(userId, sessionId, trx);
    await trx("carts").where({ id: cart.id }).forUpdate().first();
    const product = await trx("products")
      .where({ id: productId, is_active: true })
      .forUpdate()
      .first();
    if (!product) throw new NotFoundError("Product not found");
    const existing = await trx("cart_items")
      .where({ cart_id: cart.id, product_id: productId })
      .first();
    if (!add && !existing) throw new NotFoundError("Cart item not found");
    const next = quantity + (add ? (existing?.quantity ?? 0) : 0);
    if (next > product.stock_quantity)
      throw new ValidationError("Not enough stock");
    await trx("cart_items")

// storeService.ts:134
export async function checkout(
  userId: number,
  payload: { addressId: number; shippingMethod: string; paymentMethod: string },
) {
  return db.transaction(async (trx) => {
    const address = await trx("addresses")
      .where({ id: payload.addressId, user_id: userId })
      .first();
    if (!address) throw new NotFoundError("Address not found");
    const cart = await store.getOrCreateCart(userId, null, trx);
    await trx("carts").where({ id: cart.id }).forUpdate().first();
    const cartRows = await trx("cart_items").where({ cart_id: cart.id });
    await trx("products")
      .whereIn(
        "id",
        cartRows.map((row) => row.product_id),
      )
      .orderBy("id")
      .forUpdate();
    const items = await store.getCartItems(cart.id, trx);
    if (!items.length) throw new ValidationError("Cart is empty");
    for (const item of items as any[]) {
      if (
        !item.product.is_active ||
        item.product.stock_quantity < item.quantity
      )
        throw new ValidationError(`${item.product.name} is out of stock`);
    }
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.unit_price) * item.quantity,
```

## Why removal and merge do not take the product lock

`changeCartQuantity` and `checkout` lock `products` because they *read* `stock_quantity` and then decide; the lock is what keeps that read true until the write. `removeCartItem` (`storeService.ts`) deletes a `cart_items` row and never reads stock, so there is nothing a concurrent checkout could invalidate: whichever order the delete and the checkout commit in, stock is right and the cart reflects the last writer. `mergeCart` runs in a transaction but also skips the product lock; it copies quantities from a guest cart, and the next `checkout` re-validates every line against locked stock anyway. If a future change made `mergeCart` clamp to stock, it would need the same `forUpdate()` as `changeCartQuantity`. The rule: lock what you read to decide, not what you merely write.

## How to reason through the code

1. Identify the inputs. Distinguish data supplied by a caller from state read from storage or a trusted context.
2. Find the guard clauses. For each early return or thrown error, describe which invariant it protects and whether anything has already been written.
3. Find the candidate state or query. Explain whether it mutates an existing object or constructs a replacement.
4. Locate the persistence operation. For asynchronous code, follow the promise through success and rejection; for transactions, check that all related writes use the same transaction object.
5. Find the output or state publication. Ask what a repeated invocation would do after the first invocation succeeds.

Use this project-specific reasoning as your guide:

A cart does not reserve stock. Two users may each put the last item into their cart, but only one should successfully check out. The checkout transaction serializes access to the product and reads its current stock after the lock. The losing request leaves its cart available for correction rather than creating a negative stock balance.

Two checkouts of one cart also need coordination. Locking the cart means the second request sees an empty cart after the first commits. Locking only product rows would not clearly protect the cart's logical one-order boundary. Products are locked in a consistent ID order to reduce deadlock risk when carts contain the same products in different order.

The order, line items, stock decrement and cart removal share one transaction. The failure-injection test rejects an order-item insert and observes stock and cart, not just the HTTP 500. The app retains demo user headers, mock payment and existing pricing/shipping policy. It is not connected to a payment provider. Cart merge and administrative operations still need separate review before a production design.

## Three variations to work through

**Normal variation — cumulative additions.** With a product at stock 3, add 2, then add 1, then try to add 1 more. Predict: 200, 200, 400 `Not enough stock`, and the `cart_items` row at quantity 3. Before the change the third call would have passed (it compared the increment, 1, against stock, 3).

**Invalid variation — an empty or stale cart.** Check out with no cart lines: predict 400 `Cart is empty` and no `orders` row. Then add a line, set the product `is_active = false` in `psql`, and check out: predict 400 `<name> is out of stock` and the cart line still present.

**Boundary variation — the last unit.** Reproduce the second test: two users each hold the last unit in their carts and check out concurrently. Predict `[201, 400]`, `stock_quantity = 0`, one `order_items` row. Then remove the products `forUpdate()` on a throwaway branch and repeat until you see `[201, 201]` and stock `-1`; restore it.

## Executable examples

These are the actual regression tests in [test/checkout.test.ts](../test/checkout.test.ts). Read each test as arrange → act → assert. Setup creates a controlled initial state, the action exercises the application code, and assertions compare observable behavior with an independently stated expectation.

```typescript
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { database, request } from "./database.js";
let h: Awaited<ReturnType<typeof database>>;
before(async () => {
  h = await database();
  for (const id of [1, 2]) {
    await h.db("users").insert({
      id,
      email: `u${id}@example.com`,
      password_hash: "demo",
      display_name: "Learner",
    });
    await h.db("addresses").insert({
      id,
      user_id: id,
      full_name: "Learner",
      street_line_1: "1 Test St",
      city: "Test",
      state: "CA",
      zip_code: "00000",
    });
  }
});
after(async () => {
  if (h) await h.close();
});
const api = (path: string, method = "GET", body?: unknown, user = 1) =>
  request(h.origin, "/api" + path, method, body, {
    "x-demo-user-id": String(user),
  });
async function product(sku: string, stock: number) {
  return (
    await h
      .db("products")
      .insert({ name: sku, slug: sku, sku, price: 10, stock_quantity: stock })
      .returning("*")
  )[0];
}
async function checkout(user: number) {
  return api(
    "/checkout",
    "POST",
    { addressId: user, shippingMethod: "standard", paymentMethod: "mock_card" },
    user,
  );
}
test("cumulative additions and edits cannot exceed stock", async () => {
  const p = await product("bounds", 3);
  assert.equal(
    (await api("/cart/items", "POST", { productId: p.id, quantity: 2 })).status,
    201,
  );
  assert.equal(
    (await api("/cart/items", "POST", { productId: p.id, quantity: 2 })).status,
    400,
  );
  assert.equal(
    (await api(`/cart/items/${p.id}`, "PUT", { quantity: 4 })).status,
    400,
  );
  assert.equal(
    (await h.db("cart_items").where({ product_id: p.id }).first()).quantity,
    2,
  );
  await api(`/cart/items/${p.id}`, "DELETE");
});
test("two buyers cannot buy the same last unit", async () => {
  const p = await product("last", 1);
  for (const user of [1, 2])
    await api("/cart/items", "POST", { productId: p.id, quantity: 1 }, user);
  const result = await Promise.all([checkout(1), checkout(2)]);
  assert.deepEqual(
    result.map((r) => r.status).sort(),
    [201, 400],
    JSON.stringify(result),
  );
  assert.equal(
    (await h.db("products").where({ id: p.id }).first()).stock_quantity,
    0,
  );
  assert.equal(
    Number(
      (
        await h
          .db("order_items")
          .where({ product_id: p.id })
          .count("* as n")
          .first()
      ).n,
    ),
    1,
  );
  await h.db("cart_items").delete();
});
test("double checkout makes one order and late failure preserves cart and stock", async () => {
  const p = await product("rollback", 5);
  await api("/cart/items", "POST", { productId: p.id, quantity: 1 });
  await h.db.raw(
    `CREATE FUNCTION reject_order_item() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$; CREATE TRIGGER reject_order_item BEFORE INSERT ON order_items FOR EACH ROW EXECUTE FUNCTION reject_order_item();`,
  );
  assert.equal((await checkout(1)).status, 500);
  assert.equal(
    (await h.db("products").where({ id: p.id }).first()).stock_quantity,
    5,
  );
  assert.ok(await h.db("cart_items").where({ product_id: p.id }).first());
  await h.db.raw("DROP TRIGGER reject_order_item ON order_items");
  const result = await Promise.all([checkout(1), checkout(1)]);
  assert.deepEqual(result.map((r) => r.status).sort(), [201, 400]);
  assert.equal(
    (await h.db("products").where({ id: p.id }).first()).stock_quantity,
    4,
  );
});
```

## Explain it back

Give a five-minute walkthrough: the original problem, one invariant, the exact changed function, the most revealing failure test, and one remaining limitation. You should be able to explain why the implementation is correct for the worked example without reading the code aloud line by line.
