# FABLE Guide — Multi-Vendor Marketplace

**Project 20: the capstone. Everything composes here.** A multi-vendor marketplace is
three of your earlier systems welded together under adversarial conditions: Project
13's storefront (carts, checkout, orders), Project 10's ledgers (stock, and now
money owed to vendors), and Project 16's enterprise kit (this scaffold shares it —
soft delete, audit, saved views, bulk ops; **read 16's FABLE guide first**). The new
pressure is **three-sided trust**: buyers, vendors, and the platform all have partial
views, partial permissions, and misaligned incentives. Marketplace engineering is
mostly deciding who may see and do what, and proving money math to people who don't
trust each other.

**What the scaffold gives you:** vendor-scoped `listings` with a moderation lifecycle
(`draft/active/flagged/paused/archived`), priority-as-merchandising
(`low/medium/high/featured`), generic comments, bulk listing status operations, audit
framed as "revenue-impacting changes," dashboard, and the kit's plumbing. API on **:4120**.
What it does *not* give you yet: orders, payments, carts or ledgers; price and inventory
live only in `metadata` JSON; and `vendor_id` is stamped on rows but never used to
filter reads (the request context has no vendor identity).

**Stack:** React 18 + Vite + TypeScript / Express + Knex + PostgreSQL.

## 1. Run it (10 minutes)

```bash
# the server loads ../.env (relative to server/), i.e. a project-root .env:
cd 20-marketplace-platform && cp .env.example .env   # create the DB_NAME it names
cd server && npm install && npm run migrate && npm run seed && npm run dev
# another terminal
cd 20-marketplace-platform/client && npm install && npm run dev
```

```bash
curl "http://localhost:4120/api/listings?status=active&sort=priority"
curl "http://localhost:4120/api/listings/dashboard"
# moderation: flag a listing, check the audit names the actor
curl -X POST http://localhost:4120/api/listings/bulk/status -H "content-type: application/json" \
  -H "x-demo-user: you@example.com" -H "x-demo-role: operator" -d '{"ids":[1],"status":"flagged"}'
curl "http://localhost:4120/api/listings/audit?limit=5"
```

**Orientation pass (30 min):** diff `services/service.ts` / `models/model.ts` against
Project 16's, then read `docs/journal.md`. The scaffold is one resource; the capstone
labs below grow it into a marketplace.

## 2. What this domain teaches

1. **Vendor scoping is tenancy with an audience.** P16's `workspace_id` was internal
   hygiene; here `vendor_id` separates *competitors*. A leak isn't a bug, it's a
   scandal.
2. **Moderation gates revenue.** `flagged` and `paused` listings must vanish from the
   public catalog *immediately* but stay visible (with reasons) to their vendor —
   the P17 two-audience problem with money attached.
3. **The platform is an accountant.** An order's money splits into vendor earnings
   and platform commission, and both sides will check your math. Ledgers (P10) stop
   being a modeling choice and become the product.

## 3. The challenge ladder

### Level 1 — Junior
1. **Lifecycle machine + reasons:** transitions-as-data (`draft → active`,
   `active ↔ paused`, `active → flagged → active/archived`), 409 on illegal jumps,
   and a required reason comment entering `flagged` (P18/P19's rule — third
   repetition, should be muscle memory).
2. **Public catalog projection:** `GET /api/catalog` returning only `active` listings
   with a trimmed public field set (no moderation notes, no audit residue, no vendor
   internals in `metadata`). P18's Lab 2, commerce edition.

### Level 2 — Mid
3. **Vendors as first-class tenants:** a `vendors` table and a `listings.vendor_id`
   FK already exist, but nothing enforces them; make the context middleware map demo
   identity → vendor, and make *every* vendor-facing query filter by it (and stop
   `vendor_id` being editable through `PUT`). Prove isolation with the test that matters:
   vendor A curls vendor B's draft listing and gets a 404 (not 403 — decide and
   defend, citing P5's ownership question). Operators see everything; the audit log
   distinguishes vendor edits from platform moderation.
4. **Orders that split money:** port P13's cart/checkout shape, minimally: an order
   with lines from *multiple vendors*. At checkout, compute per-line
   `vendor_earnings` and `platform_fee` (table-driven commission rate, e.g. 10%) and
   **snapshot them onto the line** (P13's price-integrity lesson: never recompute
   history from live rates). One checkout transaction; stock decrement with the P10/13
   race guard.
5. **Vendor dashboard:** per-vendor sales totals, earnings owed, top listings —
   aggregates strictly scoped by vendor (the P3 GROUP BY skills inside the Lab 3
   tenancy walls). One deliberately tricky number: platform-wide "marketplace volume"
   on the operator dashboard must equal the sum of all vendor dashboards. Write the
   reconciliation query that proves it.

### Level 3 — Senior
6. **The payout ledger (capstone lab):** append-only `vendor_ledger`
   (`vendor_id, amount, type: sale|refund|payout|adjustment, reference, created_at`) —
   P10's stock ledger, denominated in money. Sales credit it (inside the order
   transaction), payouts debit it, balance = SUM. Build `POST /api/vendors/:id/payouts`
   (operator-only) that pays out the current balance atomically against concurrent
   sales (the race: a sale lands between balance-read and payout-write — guard it,
   P10 Lab 3 style, and write the test). Refunds produce *negative* ledger entries and
   commission reversal — decide whether the platform fee is refunded too, and note
   that this is a business decision wearing an engineering costume.
7. **Trust memo (1 page):** what does each party see of a dispute? Buyer says "never
   arrived," vendor says "shipped," platform must adjudicate with evidence = order
   rows + status history + audit log + ledger entries. Audit your Labs 3–6 output:
   could you actually reconstruct the story? Every gap you find is a missing audit
   write. End with the marketplace's version of P16's soft-delete question: what may
   *never* be deleted, even softly, and for how long (financial retention)?
8. **Where does this architecture crack? (1 page, the curriculum's closing essay):**
   one Postgres, one Express app, service-layer tenancy. At what scale (vendors,
   listings, orders/day) do search, the audit table, the single write path, and
   dashboard aggregates each become the bottleneck — and what's the *boring first
   mitigation* for each (indexes, read replicas, materialized views, queue) before
   anyone says "microservices"? Cite specific queries from your own labs. If you can
   write this page credibly, the twenty projects did their job.

## 4. Questions you should be able to answer afterward

- Why must commission be snapshotted per order line rather than computed from the current rate at read time?
- Vendor A requesting vendor B's resource: 404 or 403, and why might the answer differ between listings (secret) and storefront pages (public)?
- Why is the payout race the same problem as P10's oversell and P14's double-booking? State the shared shape (read-check-write on shared state) and the two standard guards.
- What's the difference between the audit log and the ledger? (Actions vs. value; evidence vs. balance — and why both must exist.)
- Which single query in your marketplace would you protect with a reconciliation job, and what drift would it catch?

## 5. Common traps

- **Moderation hiding listings from the vendor too:** `flagged` must disappear from the *catalog*, not from the vendor's own list — scoping bugs cut both ways.
- **Splitting money with floats:** commission math in integer cents (P3/P10's rule) — one rounding decision (who gets the odd cent?) documented, tested, and applied consistently.
- **Multi-vendor orders fulfilled as one unit:** vendor B's item ships, vendor A's doesn't — order status must be per-line or per-vendor-suborder. Decide before Lab 4, not after.
- **Deleting a vendor:** listings, orders, ledger entries, payouts all reference them. This is the strongest version of P10's "the ledger must survive the product" — the vendor row is effectively permanent; design offboarding as a status, not a delete.

**End of the line.** You've gone from a task list to a marketplace with tenancy,
moderation, and money. The through-line: layers (P1), boundaries (P6–7), transactions
(P5/P13), state machines (P9), ledgers (P10/P20), and the enterprise kit (P16) — every
one of them earned twice, once by reading and once by building.
