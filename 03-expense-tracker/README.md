# Project 3: Personal Expense Tracker

Full-stack JavaScript expense tracker with category budgets, recurring expense flags, CSV export, and Recharts dashboards.

## Run locally

1. Create a PostgreSQL database named `expense_tracker_dev`.
2. Copy `.env.example` to `.env`.
3. In `server/`, run `npm install`, `npm run migrate`, `npm run seed`, then `npm run dev`.
4. In `client/`, run `npm install` then `npm run dev`.

## Features

- Expense CRUD with date range and category filtering.
- Category management with colors and icon names.
- Monthly budgets per category with warning/exceeded status.
- Monthly, weekly, daily trend, and category aggregation endpoints.
- CSV export for filtered expenses.
