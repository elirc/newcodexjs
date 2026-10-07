# Project 13: E-Commerce Storefront

A self-contained TypeScript storefront for learning catalog filters, carts, checkout transactions, order history, reviews, wishlist, and admin product/order management.

## Run locally

1. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
2. Copy the project-root `.env.example` into `server/.env` and create the database. Note: the `DATABASE_URL` in `.env.example` reads `...localhost:5432=ecommerce_storefront`; change the `=` to `/` or the URL points at the default database. (The root `package.json` also offers `npm run db:migrate`, `npm run db:seed`, `npm run dev` and `npm test`; tests need `ASTRA_TEST_DATABASE_URL` pointing at an `astra_test_*` database.)
3. Run:
   ```bash
   cd server
   npm run migrate
   npm run seed
   npm run dev
   cd ../client
   npm run dev
   ```

## Demo auth

Authenticated routes use `x-demo-user-id`. Guest cart routes use `x-session-id`, and the client persists a session id in `localStorage`. Because the bundled client always sends `x-demo-user-id: 2`, the server uses that user's cart; the guest cart and `POST /api/cart/merge` are reachable only from curl (see docs/architecture.md).

## Included scope

- Catalog with category, price, rating, stock, and sort filters.
- Product details with images, reviews, and related products.
- Cart add/update/remove plus guest session persistence.
- Mock checkout that creates orders, deducts stock, and clears the cart in a transaction.
- Order history, wishlist, review creation, admin product CRUD, status updates, and dashboard stats.

See [docs/architecture.md](docs/architecture.md) for design notes.

## Junior SWE learning course

[Start the detailed Astra upskilling course](astraupskill/README.md): locking shared inventory and preserving a failed checkout, with a codebase map, worked implementation, executable examples, debugging labs, exercises and solution discussions.
