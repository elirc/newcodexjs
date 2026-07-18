# Architecture

The app follows the Tier 1 conventions: React Vite frontend, Express API, PostgreSQL 16, Knex models, thin controllers, service-layer business logic, centralized errors, and a standard response envelope.

## Backend

- `src/controllers` parses HTTP input and returns `{ success, data }`.
- `src/services` validates and coordinates contact/tag workflows.
- `src/models` contains only Knex queries, including joins for tags and pagination counts.
- `src/middleware/errorHandler.js` converts thrown `AppError` subclasses into `{ success: false, error }`.
- Migrations are reversible and seeds create 50 contacts, 8 tags, and realistic contact-tag assignments.

## Frontend

The frontend keeps state in `App.jsx` with small feature components under `src/features/contacts`. It uses axios service functions, a 300ms debounce hook, CSS Modules for layout, and browser Blob APIs for CSV export/import.

## Tradeoff

The import endpoint accepts CSV as raw text or `{ csv }` JSON instead of multipart form data. That keeps Project 2 aligned with the appendix dependency set, which does not introduce `multer` until later projects.
