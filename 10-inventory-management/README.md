# Inventory Management

Self-contained Tier 1 full-stack app for the corrected curriculum.

## Run Locally

1. Create a PostgreSQL database named `inventory_management_dev`.
2. Copy `.env.example` to `.env` and adjust credentials.
3. Install dependencies in both apps:

```bash
npm --prefix server install
npm --prefix client install
npm --prefix server run migrate
npm --prefix server run seed
npm --prefix server run dev
npm --prefix client run dev
```

Server: `http://localhost:4110`
Client: `http://localhost:5173`

## Learning Focus

- stock movement audit trail
- purchase and sales order concepts
- Knex transactions
- SQL report patterns

## API Overview

- `GET /api/products` lists records with optional `search` and `status` filters.
- `GET /api/products/stats` returns dashboard counts.
- `GET /api/products/:id` returns one record.
- `POST /api/products` creates a record.
- `PUT /api/products/:id` updates a record.
- `DELETE /api/products/:id` deletes a record.

## Notes

This project is intentionally educational: controllers stay thin, services hold validation and business rules, models own Knex queries, and responses use the standard success/error envelope.

## Junior SWE learning course

[Start the detailed Astra upskilling course](astraupskill/README.md): partial updates, JSON fields and recoverable forms, with a codebase map, worked implementation, executable examples, debugging labs, exercises and solution discussions.
