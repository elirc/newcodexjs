# Concepts explained from first principles

[Course index](README.md)

## The central idea: locking shared inventory and preserving a failed checkout

A cart does not reserve stock. Two users may each put the last item into their cart, but only one should successfully check out. The checkout transaction serializes access to the product and reads its current stock after the lock. The losing request leaves its cart available for correction rather than creating a negative stock balance.

Two checkouts of one cart also need coordination. Locking the cart means the second request sees an empty cart after the first commits. Locking only product rows would not clearly protect the cart's logical one-order boundary. Products are locked in a consistent ID order to reduce deadlock risk when carts contain the same products in different order.

The order, line items, stock decrement and cart removal share one transaction. The failure-injection test rejects an order-item insert and observes stock and cart, not just the HTTP 500. The app retains demo user headers, mock payment and existing pricing/shipping policy. It is not connected to a payment provider. Cart merge and administrative operations still need separate review before a production design.

## Invariants: a precise way to describe correctness

An invariant is a rule that must remain true before and after an operation. “The app works” is too broad to test. “A failed import writes no records” or “editing preserves the record id” gives you something observable. For this project, derive your invariants from this behavior:

> Cart additions/edits validate the cumulative quantity under a cart/product lock. Checkout locks the cart and products in ID order, rechecks active stock, then writes order/items, decrements stock and clears the cart atomically.

Turn each sentence into a small state table. The columns are initial state, input, expected final state and expected feedback. Include one rejected input and one retry/repeated action where relevant. A useful invariant should be meaningful even if the implementation changes from an array to a database or from one UI component to another.

## Validation versus normalization

Validation rejects values the operation cannot accept. Normalization converts acceptable values to the representation the rest of the program expects. Trimming a comparison string is normalization; rejecting an empty required field is validation. Neither operation should silently invent facts. If a quantity is free-form text, do not guess a numerical interpretation. If an imported record is malformed, do not quietly save only the convenient subset unless that is the explicit product policy.

Apply this distinction to the data model:

A cart belongs to a user or guest session. cart_items reference products and store quantity/unit_price. Orders snapshot address and monetary totals; order_items snapshot product details. Products store stock_quantity. Payment is the existing mock payment flow.

Which fields can be omitted? Which can be empty? Which have a bounded vocabulary? Which have stable identity? Write those answers down before adding another conditional. A schema is simply an explicit description of that expected shape and meaning.

## State transitions and failure boundaries

Every change has an ordering. If memory changes first and persistence fails, the UI can show data that will disappear after reload. If persistence succeeds first and rendering fails, the stored data may be correct while the screen is stale. There is no universal answer for every feature, but the choice must be deliberate and observable. The worked change makes one specific promise; the tests check that promise.

A promise represents an operation that completes later. `await` does not make it infallible or atomic; it gives the caller a place to handle success and rejection. Similarly, calling several functions inside one `try` block does not create a database transaction. Atomicity must come from a storage operation or transaction boundary that actually provides it.

## Identity, representation and derived values

Keep a stable id when updating an existing record. Compute display-only values from authoritative data when feasible, so there are fewer independently mutable facts to keep synchronized. Be careful when converting between strings and numbers: `Number('')` is zero, JSON cannot faithfully represent Infinity, and a date string can have different semantics from a timestamp. The specific conversions in this lesson are visible in the worked source, so step through them with a concrete value.

## Small design decisions deserve explanations

Before extracting a new abstraction, explain what repeated responsibility it would own. A helper that merely renames one expression may add little. A pure validator or one transaction boundary can make an important guarantee easier to test. Prefer an explanation tied to this project’s behavior over a rule such as “all code must use a particular pattern.”

Write a short decision note: “We chose X because it preserves Y under Z. It does not yet solve W.” Use the limitations in the worked example to fill in those letters. This is the beginning of engineering judgment: choosing a bounded solution and accurately describing its limits.

## Why the products are locked in id order

`checkout` in `server/src/services/storeService.ts` locks the cart row, then every product in the cart with `whereIn(...).orderBy("id").forUpdate()`. The `orderBy("id")` is not cosmetic. Two carts holding the same two products in opposite order would otherwise lock them in opposite order:

| step | transaction A (cart: 7, then 3) | transaction B (cart: 3, then 7) |
|---|---|---|
| 1 | `SELECT ... WHERE id = 7 FOR UPDATE` (holds 7) | |
| 2 | | `SELECT ... WHERE id = 3 FOR UPDATE` (holds 3) |
| 3 | `... WHERE id = 3 FOR UPDATE` -> waits for B | |
| 4 | | `... WHERE id = 7 FOR UPDATE` -> waits for A |
| 5 | PostgreSQL detects the cycle after `deadlock_timeout` and aborts one side with `40P01 deadlock_detected` | |

With `ORDER BY id`, both transactions ask for 3 first and 7 second, so the second one simply waits at step 2 and proceeds after the first commits. Note that a single `SELECT ... WHERE id IN (...) ORDER BY id FOR UPDATE` acquires the row locks in the order the rows are returned, which is what makes the one-statement form safe. Exercise 3 asks you to observe the difference; predict the two outcomes before you run it.

