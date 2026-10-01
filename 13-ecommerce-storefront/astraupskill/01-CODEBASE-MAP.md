# Codebase map and reading order

[Course index](README.md)

## The problem this project solves

Repeated cart additions could exceed stock; checkout read stock without locking, allowing overselling or duplicate orders from concurrent requests. The improvement you will study is: Cart additions/edits validate the cumulative quantity under a cart/product lock. Checkout locks the cart and products in ID order, rechecks active stock, then writes order/items, decrements stock and clears the cart atomically.

## Data model

A cart belongs to a user or guest session. cart_items reference products and store quantity/unit_price. Orders snapshot address and monetary totals; order_items snapshot product details. Products store stock_quantity. Payment is the existing mock payment flow.

An object is a named collection of fields. An array is an ordered collection of values. An id answers “which record?”; an index answers “where is it in this array right now?” Those questions are different whenever the list can be filtered, reordered or edited. Persisted data is the form that must survive a process/page restart. Derived data can be recomputed from that persisted state.

## Trace one action

1. A React form, button or test sends a concrete operation.
2. The client serializes editable values as an HTTP request.
3. The server validates runtime input and the relevant record relationships.
4. The repository or model reads authoritative state and performs the documented change.
5. The storage boundary commits or rejects the operation.
6. The response or broadcast gives the client its observed result.

```mermaid
flowchart LR
    A[Input or user action] --> B[Validate and normalize]
    B --> C[Compute intended change]
    C --> D[Commit at the state boundary]
    D --> E[Return or render observed state]
    B --> F[Explain invalid input]
    D --> G[Handle a failed write]
```

This diagram names responsibilities, not necessarily separate files. A small browser program can keep them in app.js. A larger API spreads them across controllers, services and models. Follow the actual sequence above rather than assuming every repository has the same architecture.

## Where to read first

1. [server/src/services/storeService.ts](../server/src/services/storeService.ts): locate `checkout` and read its inputs, branches and return/side effects.
2. [test/checkout.test.ts](../test/checkout.test.ts): read the scenario names before the helper code.
3. The root [README](../README.md): connect setup and the larger application workflow.

## Source navigation

- [client/src/App.tsx](../client/src/App.tsx)
- [client/src/main.tsx](../client/src/main.tsx)
- [client/src/services/api.ts](../client/src/services/api.ts)
- [client/src/types/store.ts](../client/src/types/store.ts)
- [client/src/vite-env.d.ts](../client/src/vite-env.d.ts)
- [client/vite.config.ts](../client/vite.config.ts)
- [server/db/migrations/001_init.ts](../server/db/migrations/001_init.ts)
- [server/db/seeds/001_seed.ts](../server/db/seeds/001_seed.ts)
- [server/knexfile.ts](../server/knexfile.ts)
- [server/scripts/database.ts](../server/scripts/database.ts)
- [server/src/app.ts](../server/src/app.ts)
- [server/src/config/db.ts](../server/src/config/db.ts)
- [server/src/config/env.ts](../server/src/config/env.ts)
- [server/src/controllers/storeController.ts](../server/src/controllers/storeController.ts)
- [server/src/index.ts](../server/src/index.ts)
- [server/src/middleware/errors.ts](../server/src/middleware/errors.ts)
- [server/src/middleware/validate.ts](../server/src/middleware/validate.ts)
- [server/src/models/storeModel.ts](../server/src/models/storeModel.ts)
- [server/src/routes/storeRoutes.ts](../server/src/routes/storeRoutes.ts)
- [server/src/services/storeService.ts](../server/src/services/storeService.ts)
- [server/src/utils/http.ts](../server/src/utils/http.ts)
- [server/src/validators/storeValidators.ts](../server/src/validators/storeValidators.ts)

## A practical reading technique

At each function boundary, write down the value coming in, the value going out and any side effect. A side effect includes a storage write, SQL query, network request, timer registration or DOM update. If a function calls another function, inspect only that next dependency until you can finish the chosen trace. Return to unrelated files later.

For this lesson, start with: **With stock 3, adding 2 succeeds but adding another 2 or editing to 4 fails and leaves quantity 2. Two buyers checking out the last unit yield one order. Force an order-item failure: stock and cart remain; retrying normally succeeds.** Mark where the id, time, amount or other important value changes representation. For example, JSON serializes values into text; a date field may be a calendar string; SQL aggregates may return a different type from individual rows. Representation changes are common bug locations.

## Check your understanding

Without reading the solution, answer: Who owns the mutable state? Which input is untrusted? Which function first decides whether the operation is valid? What survives reload or restart? What observation would prove that the operation partially failed? Point to a source file for each answer, rather than describing a generic app from memory.
