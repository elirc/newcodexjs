# Project 15: REST API Testing Tool

Self-contained TypeScript Postman-lite app with a three-panel UI, collections/folders, environments, variable interpolation, request history, and a backend proxy endpoint for avoiding browser CORS limits.

## Run locally

1. Create a PostgreSQL database named `api_tester`.
2. Copy `.env.example` into `server/.env` and `client/.env` as needed.
3. In `server/`, run `npm install`, `npm run migrate`, `npm run seed`, then `npm run dev`.
4. In `client/`, run `npm install`, then `npm run dev`.

The frontend expects the API at `http://localhost:4215/api` and runs on `http://localhost:5175`.

## Implemented scope

- Proxy endpoint with method, URL, headers, params, body, auth, timing, size, and history logging.
- Collections with one-level folders, saved requests, duplicate, import, and export APIs.
- Environments with active switching and `{{variable}}` interpolation.
- Request history with pagination and delete/clear APIs.
- Three-panel React UI: collections/history, request builder, response viewer.
- CodeMirror wired through `@codemirror/view`, `@codemirror/lang-json`, and `@codemirror/theme-one-dark`.

## Tradeoffs

Drag-and-drop is represented structurally by the one-level folder tree and sort fields, but the UI does not implement pointer-based reordering. Timing is measured as total elapsed proxy time; browser-like DNS/connect/TLS timing is represented as an extensible `timing` object with `totalMs`.

## Junior SWE learning course

[Start the detailed Astra upskilling course](astraupskill/README.md): atomic active selection and validating replacement collections, with a codebase map, worked implementation, executable examples, debugging labs, exercises and solution discussions.
