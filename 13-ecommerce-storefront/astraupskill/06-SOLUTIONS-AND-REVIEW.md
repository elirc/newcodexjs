# Solutions and engineering review

[Course index](README.md) · [Practice prompts](05-PRACTICE.md)

Attempt each exercise before using these notes. These are solution approaches and review criteria, not claims that every extension has been implemented. The actual completed behavior is described in the worked-change chapter.

## Existing implementation

Cart additions/edits validate the cumulative quantity under a cart/product lock. Checkout locks the cart and products in ID order, rechecks active stock, then writes order/items, decrements stock and clears the cart atomically.

The key model is: A cart belongs to a user or guest session. cart_items reference products and store quantity/unit_price. Orders snapshot address and monetary totals; order_items snapshot product details. Products store stock_quantity. Payment is the existing mock payment flow.

The worked fixture should behave as follows: With stock 3, adding 2 succeeds but adding another 2 or editing to 4 fails and leaves quantity 2. Two buyers checking out the last unit yield one order. Force an order-item failure: stock and cart remain; retrying normally succeeds.

## Extension solutions

### Exercise 1

**Prompt:** Show which cart line lost availability after a failed checkout.

**Approach:** Return structured product identifiers in stock errors and retain the cart; allow users to adjust quantities or remove the item.

**Review:** the failed checkout must answer 400 with a structured `details: [{ productId, requested, available }]` array (extend `ValidationError` or add a field) built from the same loop that throws `is out of stock`; the cart must be untouched (assert the `cart_items` row still exists, like the third test); the UI must highlight that line and keep the others editable.

### Exercise 2

**Prompt:** Display a checkout price breakdown from server-returned totals.

**Approach:** Use the server as the final price authority. UI estimates must not overwrite persisted order totals.

**Review:** the breakdown must display `subtotal`, `shipping_cost`, `tax_amount` and `total` exactly as returned by the server's `totals()`; a client estimate may be shown before checkout but must be replaced by the server values on success; assert in a server test that the persisted `orders.total` equals the response and that a client-supplied total is ignored.

### Exercise 3

**Prompt:** Test two carts whose product order is reversed.

**Approach:** Include the same two products in opposite order and submit concurrently; assert no oversell and investigate any deadlock response.

**Review:** create two carts holding the same two products in opposite insertion order and run `checkout(1)` and `checkout(2)` in a `Promise.all`; with the shipped `orderBy("id")` you must observe `[201, 400]` or `[201, 201]` (depending on stock) and never a 500; then on a throwaway branch remove `orderBy("id")` and lock in cart order, repeat until you observe a `40P01` in the server log, and write down the interleaving.

### Exercise 4

**Prompt:** Design a real payment workflow with idempotency.

**Approach:** Separate payment authorization from final order state, use stable idempotency keys and reconcile retries/webhooks. A SQL transaction cannot atomically commit an external payment API.

**Review:** the design must separate `payment_status` from `status`, store an idempotency key per checkout attempt (unique index) so a retried `POST /checkout` returns the same order instead of a second one, and explain why the external payment call cannot sit inside the SQL transaction (a committed charge with a rolled-back order, or the reverse).

### Exercise 7 — ownership of orders and addresses

Reference (scope in the query, not after it):

```typescript
export function findOrderForUser(orderId: number, userId: number) {
  return db("orders").where({ id: orderId, user_id: userId }).first();
}
// service
const order = await store.findOrderForUser(id, userId);
if (!order) throw new NotFoundError("Order not found");
```

Reference test skeleton: after `checkout(1)` returns `201` with `data.id`, `api("/orders/" + id, "GET", undefined, 2)` -> 404; `api("/orders/" + id, "GET", undefined, 1)` -> 200; `api("/orders", "GET", undefined, 2)` -> body does not include `id`.

Review: explain why a post-query filter (`orders.filter(o => o.user_id === userId)`) is worse even when it returns the same rows (it reads everything, and a later pagination change would leak counts).

## Review questions with answer guidance

**Why not trust input just because it came from this UI?** A caller can bypass the UI, a saved file can be edited, and older data can have a different shape. Validate at the boundary that owns the operation.

**Why keep the id stable?** It identifies the same domain record across views and edits. Changing it can create duplicates, disconnect child records or make reconciliation impossible.

**What makes the failure test meaningful?** It observes the promised state invariant. For this project, explain exactly why the failing scenario in [test/checkout.test.ts](../test/checkout.test.ts) would detect the original or a plausible regression.

**What does the test not prove?** A bounded suite does not prove all concurrency, browsers, deployment configurations or unrelated domain behavior. Name the real limitation from this lesson instead of adding a generic disclaimer.

**When should you extract a helper?** When it isolates a coherent responsibility, makes an invariant clearer or enables a meaningful test without duplicating application logic. A pure validator and a shared persistence boundary are common examples, but do not abstract solely to increase the number of files.

## A sample change explanation

“The previous behavior was: Repeated cart additions could exceed stock; checkout read stock without locking, allowing overselling or duplicate orders from concurrent requests. I changed the implementation so that: Cart additions/edits validate the cumulative quantity under a cart/product lock. Checkout locks the cart and products in ID order, rechecks active stock, then writes order/items, decrements stock and clears the cart atomically. The strongest evidence is the regression that exercises the worked fixture and checks authoritative state. A remaining design question is the final stretch exercise.”

Replace that explanation with your own words and actual test results. A strong junior engineer can connect a concrete user problem to code, verification and a clearly stated limit. Completing that explanation independently is the final checkpoint for this course.
