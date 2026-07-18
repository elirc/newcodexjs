# Validation, Auth, And Permissions

Project: **Notes App** (`04-notes-app`)

## Validation Map

- Client validation: `client/src/App.jsx:18`.
- API contract validation: `client/src/services/api.js:4`.
- Server/domain validation: `server/src/services/service.js:3`.
- Database constraints: `server/db/migrations/001_init.js:2`.

## Auth Map

This project is mostly demo/local and may not include full authentication. Treat that as a learning limitation, not a production pattern.

## What A Junior Might Miss

A hidden input or disabled UI button is not authorization. The server must enforce ownership and permission checks.

## What A Senior Checks

IDOR risk, tenant/user scoping, cookie/session settings, CSRF expectations, and whether validation happens before side effects.

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
