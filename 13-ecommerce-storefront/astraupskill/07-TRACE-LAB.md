# Trace lab: Ecommerce Storefront: atomic cart checkout

[Course index](README.md) · [Worked change](03-WORKED-CHANGE.md) · [Tests](04-TESTING-AND-DEBUGGING.md)

## Run it before you trace it

The first executable example from chapter 03, so the trace starts from a request you have actually sent:

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

Watch the server log while it runs, then follow the boundaries below with that exact request in mind.

## The concrete case

This lab connects one visible action to the code that accepts or rejects it. Use a disposable dataset and write your prediction before running the operation. The goal is to explain what each boundary contributes, not to memorize a sequence of clicks.

With stock 3, adding 2 succeeds but adding another 2 or editing to 4 fails and leaves quantity 2. Two buyers checking out the last unit yield one order. Force an order-item failure: stock and cart remain; retrying normally succeeds.

## Write the record before touching the form

A cart belongs to a user or guest session. cart_items reference products and store quantity/unit_price. Orders snapshot address and monetary totals; order_items snapshot product details. Products store stock_quantity. Payment is the existing mock payment flow.

Make a small table in your own notes with these columns: field, starting value, proposed value, and source of truth. Include identity even when the form does not display it. Include related rows or stored counters when the operation changes more than one fact. Mark a value as derived if the app recomputes it rather than storing it independently.

For example, an edit can change a title while preserving an ID. A status command can keep the same status while producing no new history. An import can contain many rows yet be rejected before any replacement begins. In each case, the meaningful observation is the promised resulting state. A success toast alone cannot establish which fields changed.

## Trace the real call path

### Boundary 1 — the store UI decides what to send

`client/src/features/store/*` and `client/src/App.tsx`: add-to-cart posts `{ productId, quantity }`, the cart page edits quantities, and the checkout form submits `{ addressId, shippingMethod, paymentMethod }`. The client shows server totals; it never computes stock or price itself. Every mutation invalidates the cart query afterwards so what you see is a re-read.

### Boundary 2 — the request leaves the browser

`client/src/services/api.ts`: `checkout(payload)` (line 46) posts to `/checkout`; cart calls go to `/cart/items`. The axios instance sends the demo identity header; `unwrap()` reads the `{ success, data }` envelope and throws the server's message otherwise, which is how `Not enough stock` and `X is out of stock` reach the page.

### Boundary 3 — the route validates the shape

`server/src/routes/storeRoutes.ts` mounts `validateBody(...)` from `storeValidators.ts` in front of each write (positive whole quantities, required checkout fields). `changeCartQuantity` (`storeService.ts:42`) re-checks `Number.isSafeInteger(quantity) && quantity >= 1` because it is also called from the merge path, not only from HTTP.

### Boundary 4 — the service locks, reads and decides inside one transaction

`checkout` (`storeService.ts:134`): `db.transaction` -> address ownership check -> cart row `forUpdate()` -> product rows `whereIn(ids).orderBy("id").forUpdate()` -> re-read cart items -> reject empty carts and any line whose `stock_quantity < quantity` or inactive product -> compute totals server-side. `changeCartQuantity` follows the same shape for a single product: lock cart, lock product, compare `next` (existing + added) with stock. The old code compared only the increment, which is the bug the first test pins.

### Boundary 5 — the model writes four things or nothing

Still inside the transaction: insert `orders`, insert `order_items`, `decrement("stock_quantity")` per product, delete `cart_items`. Knex commits when the callback returns and rolls back on throw. The third test installs a trigger that rejects the `order_items` insert: the route answers 500, stock is still 5 and the cart still has its line, which is the rollback made visible.

### Boundary 6 — the envelope tells the client what happened

`utils/http.ts` `sendSuccess` returns 201 with the order; `ValidationError` becomes 400 (`Not enough stock`, `Cart is empty`), `NotFoundError` 404, anything else 500. The two-buyers test reads `[201, 400]` from two racing checkouts and then verifies `stock_quantity = 0` and exactly one `order_items` row directly in the database.

## Predict the regression scenarios

| Scenario from the executable suite | Prediction to write before running |
|---|---|
| cumulative additions and edits cannot exceed stock | Initial records, request/input, expected result, and records that must remain unchanged. |
| two buyers cannot buy the same last unit | Initial records, request/input, expected result, and records that must remain unchanged. |
| double checkout makes one order and late failure preserves cart and stock | Initial records, request/input, expected result, and records that must remain unchanged. |

Open the test file and identify the arrange, act and assert portions. Arrange creates the synthetic starting state. Act calls the real boundary. Assert reads the observable result. Some tests repeat a call or issue two calls together; explain why a single ordinary call would miss that defect. Tests may share a deliberate fixture within one suite, so read setup and earlier scenario state before copying one case into a standalone script.

## A successful request, described precisely

Start with a valid fixture from the test. Copy the values into your own learning notes rather than copying a personal record. State which fields are required, which may be omitted and which have a special meaning when empty. Execute the operation once. Compare the response with a fresh authoritative read, then compare the UI with that read. If the UI is still loading, wait for the actual expected condition instead of guessing a fixed delay.

Record the stable ID and one changed field. Record at least one field that must remain the same. If the operation creates a child, record the parent ID stored on the child. If it updates an aggregate, compute the expected aggregate by hand. If it restores a backup, count retained, ignored and recreated records according to this project’s documented policy. These observations make a small example reusable when the implementation changes.

## A rejected request, described precisely

Now change one value to a rejected case named in the test suite. Keep everything else identical. Predict where validation fails. Run it and capture both the feedback and the authoritative state afterward. Compare the saved record, related rows and relevant counters with their pre-request values. A controlled error is useful only if the application also preserves the intended state.

Do not assume that all failures have the same status or message. Invalid input, missing records, conflicts and infrastructure errors represent different conditions. Read this app’s handler or parser to see the actual result. Browser-only parsers return a success/error union or throw an import error rather than returning an HTTP status. Translate the same correctness idea into the contract this app actually exposes.

## Read the storage boundary

The [test/database.ts](../test/database.ts) helper demonstrates migration-based isolation. It sets DATABASE_URL before importing the Knex connection and uses a unique PostgreSQL schema. The root workspace also makes pg and tsx available to the root test directory. A source import ending in .js is intentional: TypeScript resolves its .ts source during development and emitted Node code resolves .js after compilation.

Place a breakpoint immediately before the first write and another after the final write or publish step. On the success path, note what changed between those points. On the rejected-input path, the first write should never be reached when validation promises pre-write rejection. On a transactional failure path, some statements may execute and then roll back; reaching a write statement does not mean its effect committed.

An await marks a place where another operation can run. It does not itself define a transaction. When the test uses Promise.all, sketch request A and request B in two columns. Show where each acquires a lock or reads state. The test should accept either winner while insisting on the same final invariant. For synchronous or browser-only validation, explain why concurrency is outside the tested function rather than borrowing a database explanation that does not apply.

## Explain the design tradeoff

A cart does not reserve stock. Two users may each put the last item into their cart, but only one should successfully check out. The checkout transaction serializes access to the product and reads its current stock after the lock. The losing request leaves its cart available for correction rather than creating a negative stock balance.

Two checkouts of one cart also need coordination. Locking the cart means the second request sees an empty cart after the first commits. Locking only product rows would not clearly protect the cart's logical one-order boundary. Products are locked in a consistent ID order to reduce deadlock risk when carts contain the same products in different order.

The order, line items, stock decrement and cart removal share one transaction. The failure-injection test rejects an order-item insert and observes stock and cart, not just the HTTP 500. The app retains demo user headers, mock payment and existing pricing/shipping policy. It is not connected to a payment provider. Cart merge and administrative operations still need separate review before a production design.

## Change one requirement independently

**Practice task:** Show which cart line lost availability after a failed checkout.

Before implementation, write three acceptance criteria: an ordinary successful case, a rejected or cancelled case, and a case that preserves existing behavior. Identify the smallest file boundary that owns the rule. Keep the existing regression suite; add a test only when it observes a new promise. Do not reproduce the implementation line by line inside the assertion, because both copies can contain the same mistake.

After a first attempt, compare your design with this hint: Return structured product identifiers in stock errors and retain the cart; allow users to adjust quantities or remove the item.

## Debug a disagreement between layers

If the form and response disagree, inspect the request payload before editing the database code. If the response and database disagree, inspect the mapper, transaction and read query. If a test fails before an HTTP request is logged, inspect startup, environment variables and the test fixture. Missing dependencies, a busy port or an unavailable database are different from a failed business assertion. Preserve the first useful error and fix that cause before interpreting later cascading failures.

When a date looks wrong, distinguish a calendar label from an instant and check the serialization boundary. When an optional field will not clear, distinguish omission from an explicit empty/null value. When a list seems to lose a record, inspect filtering, sorting and pagination before assuming deletion. When history duplicates, compare desired-state commands with commands that represent a new event. These are diagnostic questions to apply to the actual fields above.

## Final independent checkpoint

Close this guide and give a five-minute walkthrough using only the application source and one test. Explain the user-visible problem, the input contract, the identity model, the write boundary, a failed operation and the remaining limitation. Then modify the worked fixture and predict the result without running it. Reopen the guide only after writing your answer.

A useful review note includes the exact command run, its result, and the boundary it covers. Keep browser interaction, simulated storage tests, real HTTP/database tests and compile checks distinct. The [verification page](VERIFICATION.md) records this delivery’s evidence. Exercises and proposed extensions in this course remain learner work; they are not counted as implemented features.
