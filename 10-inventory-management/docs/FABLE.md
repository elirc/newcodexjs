# FABLE Guide — Inventory Management

**Project 10: the capstone of Tier 1's first half — numbers that must never lie.**
The theme is the **ledger**: stock levels you never `UPDATE` directly, but derive from
an append-only trail of movements, written under transactions, and reported on with
real SQL. This is the mental model behind bank balances, warehouse systems, and
double-entry bookkeeping — and it composes everything from Projects 1–9: layers,
validation, transactions, state machines, and aggregate queries.

Like Projects 4 and 6–9, this is a working scaffold plus build-labs. The scaffold
serves flat `products` CRUD; the ledger, orders, and reports are yours to build.

---

## 1. What you get vs. what you build

**You get:** the standard six-file TypeScript scaffold (`routes.ts` → `controller.ts`
→ `service.ts` → `model.ts`) for `products` with list/search/stats/CRUD and the
envelope, plus a one-page React client. The scaffold's notion of stock — if you add a
quantity column and edit it freely — is exactly the anti-pattern this project cures.

**You build:**

| Upgrade | The lesson inside it |
|---|---|
| Stock movement ledger | Append-only `stock_movements`; on-hand quantity is a *derived* number. Why "just update the quantity" destroys auditability. |
| Purchase & sales orders | Multi-line documents with their own status machine (Project 9's pattern, reused) whose *fulfillment* writes ledger rows. |
| Knex transactions, seriously | An order receipt = order status + N movement rows + (maybe) a cached quantity, atomically. Plus your first real look at race conditions on decrement. |
| SQL report patterns | Stock-on-hand, valuation, low-stock alerts, movement history — reports as queries, not spreadsheets. |

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL.
API on **:4110**, client on :5173.

## 2. Run it (10 minutes)

```bash
createdb inventory_management_dev
cd 10-inventory-management/server && cp .env.example .env
npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 10-inventory-management/client && npm install && npm run dev
```

```bash
curl "http://localhost:4110/api/products"
curl "http://localhost:4110/api/products/stats"
```

Scaffold tour: 20 minutes, same reading order as Project 6 §3.

## 3. The labs

### Lab 1 — The movement ledger (mid) — the headline lab
New table: `stock_movements (id, product_id, quantity_delta, reason, reference, note, created_at)`
where `quantity_delta` is signed (+20 received, −3 sold, −1 damaged) and `reason` is an
enum (`purchase`, `sale`, `adjustment`, `damage`, `initial`).
- Endpoints: `POST /api/products/:id/movements` and `GET /api/products/:id/movements`.
- **Stock on hand = `SUM(quantity_delta)`** — expose it on the product detail response.
- Rules in the service: delta ≠ 0; a movement may not take on-hand below zero
  (compute inside the same transaction that inserts — see Lab 3 for why).
- **No endpoint ever edits or deletes a movement.** Corrections are new opposing
  movements (`adjustment`). Write three sentences on why this rule is the entire value
  of a ledger.
**Prove it:** seed movements by hand, sum them on paper, and match the API.

### Lab 2 — Cached quantity, honestly (mid)
Summing movements on every read is O(history). Add `products.quantity_on_hand`,
updated **in the same transaction** as each movement insert.
- Write the invariant as a check script or test: for every product,
  `quantity_on_hand = SUM(movements.quantity_delta)`. Run it after every lab.
- You have now built a **materialized aggregate with a consistency obligation** —
  name it that way in your notes; it's one of the most common real-world designs
  (and one of the most common sources of production drift when done casually).

### Lab 3 — Orders that move stock (mid→senior)
Two document types, each with lines:
`purchase_orders` / `sales_orders` (+ `*_order_lines (order_id, product_id, quantity, unit_price)`),
each with a small status machine (`draft → confirmed → fulfilled`, plus `cancelled`) —
reuse the transitions-as-data pattern from Project 9 verbatim.
- **Fulfilling** a purchase order writes +delta movements for every line; fulfilling a
  sales order writes −delta movements — all lines + status change + cached quantities
  in **one transaction**. Any line failing (e.g., would go negative) rolls back the lot.
- The race you must actually handle: two sales orders fulfill concurrently for the last
  5 units. `SELECT ... FOR UPDATE` on the product rows inside the transaction (Knex:
  `.forUpdate()`), or a guarded
  `UPDATE products SET quantity_on_hand = quantity_on_hand - ? WHERE id = ? AND quantity_on_hand >= ?`
  with an affected-rows check. Implement one; describe the other. Then *demonstrate*
  the race: two concurrent fulfillments via `Promise.all` in a script, with and
  without the guard.

### Lab 4 — Report SQL (mid→senior)
Each as an endpoint, each hand-verified against seeds:
1. **Stock on hand, all products** — from the ledger, one GROUP BY (not the cache;
   reports should audit the cache).
2. **Inventory valuation** — on-hand × unit cost. Decide *which* cost (latest purchase
   price vs. average cost); implement one, and write a paragraph on FIFO — you don't
   have to implement it, you have to know it exists and why finance cares.
3. **Low stock** — products under their `reorder_level` (add the column), with
   suggested reorder quantity.
4. **Movement summary** — per product per week: in, out, net (`FILTER (WHERE ...)`
   clauses or conditional `SUM(CASE WHEN ...)` — learn both spellings).
Render low-stock and valuation in the client dashboard.

### Lab 5 — Capstone memo (senior)
One page, as if for your tech lead: **"Ledger + cache vs. plain quantity column."**
Cover: auditability, correction workflows, read cost vs. write cost, drift risk and
the reconciliation job, what reporting each design allows, and — the senior move —
the case where the boring quantity column is *right* (tiny internal tool, no audit
requirement, one writer). Conclude with which of Projects 1–10's apps you'd build
each way and why.

## 4. Questions you should be able to answer afterward

- Why is an append-only ledger more trustworthy than an updatable quantity — what class of bug does it make *diagnosable* rather than silent?
- What exactly does `SELECT ... FOR UPDATE` lock, and what does the guarded-UPDATE alternative trade for its lock-freedom?
- Why must the negative-stock check happen inside the transaction rather than a service-level pre-check?
- When the cache and the ledger disagree, which wins, and what is your reconciliation procedure?
- What's the difference between isolation levels READ COMMITTED and SERIALIZABLE for the concurrent-fulfillment race, and why did row locking let you stay on the default?

## 5. Common traps

- **Deleting a product with movements:** hard delete orphans the ledger. This is where soft delete (`deleted_at`) finally earns its complexity — the ledger must survive the product.
- **Signed-delta confusion:** a "sale of 3" stored as `+3` with reason `sale` forces every reader to know reason semantics. Store the sign in the number; the reason is metadata.
- **Doing math on floats for money:** valuation multiplies quantity × price. Same rules as Project 3 — `numeric` in Postgres, deliberate handling in JS.
- **Testing concurrency with sequential awaits:** `await a(); await b();` proves nothing. The race only exists under `Promise.all` — write the test so it actually fails on the unguarded version.

You've finished the first half of Tier 1. Projects 11–15 add real-time patterns,
payments-shaped flows, and larger frontends — but the layers, boundaries, transactions,
and ledgers from Projects 1–10 are the foundation everything else stands on.
