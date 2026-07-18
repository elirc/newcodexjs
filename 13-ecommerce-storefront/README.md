# Project 13: E-Commerce Storefront

A self-contained TypeScript storefront for learning catalog filters, carts, checkout transactions, order history, reviews, wishlist, and admin product/order management.

## Run locally

1. Install dependencies:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```
2. Copy `.env.example` into `server/.env` and create the database.
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

Authenticated routes use `x-demo-user-id`. Guest cart routes use `x-session-id`, and the client persists a session id in `localStorage`.

## Included scope

- Catalog with category, price, rating, stock, and sort filters.
- Product details with images, reviews, and related products.
- Cart add/update/remove plus guest session persistence.
- Mock checkout that creates orders, deducts stock, and clears the cart in a transaction.
- Order history, wishlist, review creation, admin product CRUD, status updates, and dashboard stats.

See [docs/architecture.md](docs/architecture.md) for design notes.

