# Fake Code Contrasts

Project: **Notes App** (`04-notes-app`)

## Contrast: Coupling UI To SQL

```js
// Illustrative fake code: not from this repo.
await fetch("/api/raw-sql?table=note");
```

Better shape: keep SQL in `server/src/models/model.js:1` and keep UI calls behind `client/src/services/api.js:4`.

## Contrast: Swallowing Errors

```js
// Illustrative fake code: not from this repo.
try { await save(); } catch {}
```

Better shape: translate errors through `server/src/middleware/errorMiddleware.js:1` and surface a useful UI state.

## Contrast: Missing Permission Filter

```ts
// Illustrative fake code: not from this repo.
return db("records").where({ id });
```

Better shape in real multi-user code: filter by both resource id and authorized owner/team id.

## Contrast: Casual Contract Change

```ts
// Illustrative fake code: not from this repo.
return { item: row }; // changed from { data: row }
```

Better shape: preserve the response envelope used by `client/src/services/api.js:4` and controllers.

## Verification Notes

- Generated from inspected files in `04-notes-app`.
- Important anchors inspected: `client/src/App.jsx`, `server/src/app.js`, `server/src/routes/routes.js`, `server/src/services/service.js`, `server/src/models/model.js`, `server/db/migrations/001_init.js`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
