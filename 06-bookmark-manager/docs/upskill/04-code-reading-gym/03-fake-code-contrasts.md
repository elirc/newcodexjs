# Fake Code Contrasts

Project: **Bookmark Manager** (`06-bookmark-manager`)

## Contrast: Coupling UI To SQL

```js
// Illustrative fake code: not from this repo.
await fetch("/api/raw-sql?table=bookmark");
```

Better shape: keep SQL in `server/src/models/model.ts:1` and keep UI calls behind `client/src/services/api.ts:4`.

## Contrast: Swallowing Errors

```js
// Illustrative fake code: not from this repo.
try { await save(); } catch {}
```

Better shape: translate errors through `server/src/middleware/errorMiddleware.ts:2` and surface a useful UI state.

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

Better shape: preserve the response envelope used by `client/src/services/api.ts:4` and controllers.

## Verification Notes

- Generated from inspected files in `06-bookmark-manager`.
- Important anchors inspected: `client/src/App.tsx`, `server/src/app.ts`, `server/src/routes/routes.ts`, `server/src/services/service.ts`, `server/src/models/model.ts`, `server/db/migrations/001_init.ts`.
- Commands were inferred from `client/package.json` and `server/package.json`; run them locally after installing dependencies and creating the database.
- Uncertainty: these docs are a training layer, not a guarantee that every route has complete test coverage.
