# Architecture

The app follows the Tier 1 layered shape: controllers parse HTTP, services own validation and business rules, models own Knex queries, and middleware returns the standard response envelope on errors.

## Backend

- `expenseModel` contains CRUD queries plus SQL aggregation using `SUM`, `COUNT`, `AVG`, `DATE_TRUNC`, and date ranges.
- `expenseService` validates amounts, dates, recurring intervals, and category ownership rules.
- Reversible migrations create `categories`, `expenses`, and `budgets`.
- Seed data creates default/custom categories, monthly budgets, 60 expenses, and recurring examples.

## Frontend

`App.jsx` provides four app tabs: dashboard, expenses, budgets, and categories. API calls live in `src/services/api.js`; CSS Modules style the dashboard and forms. Recharts powers pie, bar, and line charts from backend aggregation endpoints.
