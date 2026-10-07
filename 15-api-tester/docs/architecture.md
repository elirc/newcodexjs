# Architecture

API Tester is a Postman-lite: the browser builds requests, and the server executes them on the user's behalf through a proxy endpoint, so the browser's CORS rules do not apply. That makes the proxy both the main feature and the main risk. `path:line` references below were checked on 2026-10-06.

## Backend

The Express backend (`server/src/app.ts`) uses thin controllers, service-level logic, Knex models, Zod validation (`middleware/validate.ts`), centralized error middleware (`middleware/errorMiddleware.ts`) and a `{ success, data }` envelope (`utils/response.ts`). All routes live in one router, `server/src/routes/index.ts`, mounted at `/api` (`app.ts:22`). The JSON body limit is 5 MB (`app.ts:14`).

Key services:

- `proxyService`: interpolates environment variables, converts param/header pairs to objects, applies bearer/basic auth, sends the request with Axios, measures total time and writes a history row (`proxyService.ts:71-146`).
- `collectionService`: collections, one-level folders, saved requests, duplicate, import and export.
- `environmentService`: environments, the single active environment, and bulk variable replacement.
- `historyService`: paginated execution history.

## Data model

From `server/db/migrations/20260703150000_create_api_tester.ts`:

| Table (lines) | Key columns and constraints |
|---|---|
| `users` (5-10) | `email` unique |
| `environments` (12-24) | `user_id`, `name`, `is_active` default false; unique `(user_id, name)` |
| `env_variables` (26-39) | `key`, `value` (text, plaintext), `is_secret`, `sort_order`; unique `(environment_id, key)`. There is no per-variable "enabled" flag. |
| `collections` (41-53) | per user, `sort_order` |
| `folders` (55-65) | `collection_id`, one level only |
| `saved_requests` (67-96) | `headers` and `params` jsonb arrays defaulting to `[]`, `auth_config` jsonb |
| `request_history` (98-117) | `method`, `url`, `request_headers` jsonb, `request_body`, `response_status`, `response_headers` jsonb, `response_body` text, size, time, `error_message` |

"Secret" variables are masked only in the UI (`EnvironmentSelector.tsx:19` prints `*****` when `is_secret`); the environments API returns their values (`environmentModel.ts:5-21` selects every column). Collection export returns only the collection tree (`collectionModel.ts:93-96`), so environment values are not exported.

## Identity (as implemented)

`attachRequestContext` sets `req.user = { id }` from `x-user-id`, defaulting to 1 (`middleware/requestContext.ts:9`). There is no role. Most models scope by `user_id`; the folder endpoints do not (see findings).

## Variable interpolation

`server/src/utils/interpolate.ts:2-10`:

```ts
template.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] ?? match)
```

Unknown names stay visible as `{{name}}`. Replacement is single-pass, so a value that itself contains `{{other}}` is not expanded again (no recursion, no infinite loop). The variable map comes from `getVariableMap` (`environmentModel.ts:135-153`): the environment named by `environmentId` if the request sends one (scoped to the user), otherwise the user's active environment. The proxy applies interpolation to the URL, param and header keys and values, the body and the auth fields (`proxyService.ts:79-86`). Values are inserted raw: nothing URL-encodes a value placed in the URL or JSON-escapes a value placed in a JSON body.

## Request trace: sending a request through the proxy (the core write)

1. The workbench calls `sendProxyRequest(draft, environmentId)` (`client/src/services/api.ts:62-74`), which posts method, URL, params and headers as `{ key, value, enabled }` arrays, the body (omitted when `bodyType` is `none`), `environmentId` and auth to `/proxy`.
2. `app.ts:14` parses JSON; `app.ts:17` attaches the user.
3. `routes/index.ts:23-27` runs `validate({ body: proxyBodySchema })` (`validators/schemas.ts:16-31`: method enum, non-empty URL string, pair arrays, optional body and auth).
4. `proxyController.ts:6-11` calls `proxyService.sendProxyRequest(req.user!.id, req.body)`.
5. `proxyService.ts:75-87` builds the variable map, interpolates, drops disabled pairs (`pairsToObject`, `:27-33`) and applies auth (`:36-50`).
6. `proxyService.ts:91-99` sends with Axios using `timeout: env.proxyTimeoutMs` (default 20000, `config/env.ts:13`) and `validateStatus: () => true`, so 4xx/5xx from the target are normal results.
7. On success the response body is stringified, measured, and stored with the interpolated request headers via `historyModel.createHistory` (`proxyService.ts:100-116`, `historyModel.ts:4-12`); on a network error or timeout a history row with `error_message` is stored and the API still answers 200 with `status: 0` and `statusText: "Network Error"` (`:125-145`).

## Senior findings (verified in source)

1. **The proxy is an open SSRF.** Any interpolated URL is fetched (`proxyService.ts:91-99`): `localhost`, private ranges, cloud metadata addresses and the API itself. Axios follows redirects by default and no protocol, host or IP check exists anywhere on this path.
2. **Secrets are written to history in plaintext.** History stores `request_headers: headers` after interpolation and after `applyAuth` (`proxyService.ts:83-86`, `:109`), so a `{{token}}` marked secret ends up as a literal `Authorization: Bearer ...` in `request_history`, and the body is stored after interpolation too (`:110`).
3. **Response bodies are unbounded.** No `maxContentLength` or truncation is set on the Axios call, and the full body is stored in `request_history.response_body` (`proxyService.ts:101-113`). One large download fills memory and the history table.
4. **Folders ignore ownership, and malformed input is a 500.** `createFolder`, `updateFolder` and `deleteFolder` take only ids (`collectionService.ts:55-75`; `collectionModel.ts:65-90` filters `where({ id })`), so any `x-user-id` can edit or delete another user's folders. Separately, `validate` uses `schema.parse` (`middleware/validate.ts:11-14`) and `errorMiddleware` maps any non-`AppError` to 500 (`errorMiddleware.ts:11-12`), so a Zod failure returns 500 "Unexpected server error" instead of 400.

## Debugging scenario

Symptom: a request to `{{baseUrl}}/users` is sent literally as `{{baseUrl}}/users` and the history row shows a network error. Path: `interpolate` leaves unknown names in place (`server/src/utils/interpolate.ts:8`), so the variable map did not contain `baseUrl`. Check which environment was used: if the client sent `environmentId`, `getVariableMap` loads that one for this user (`environmentModel.ts:139-142`); otherwise it loads the user's `is_active` environment (`:143-145`). Query `SELECT id, name, is_active FROM environments WHERE user_id = 1;` and `SELECT key, value FROM env_variables WHERE environment_id = <id>;`. The usual causes are a different active environment, a misspelled key (keys are trimmed on replace, `:103`, but not case-folded), or the `x-user-id` header pointing at another user.

## Exercise ladder (junior to mid)

1. **Goal:** see exactly what history stores. **Check:** reading `proxyService.ts:106-116`, list the fields written; confirm `request_headers` is the post-auth `headers` object, not the template pairs.
2. **Goal:** confirm there is no per-variable enable switch. **Check:** `grep -n "enabled" server/db/migrations/*.ts server/src/models/environmentModel.ts` finds nothing; `enabled` exists only on request param/header pairs (`schemas.ts:10-14`).
3. **Goal:** redact secrets in history. **Check:** before `createHistory`, header values that came from `is_secret` variables (and the `Authorization` header) are replaced with `*****`; a new test sends a request using a secret token and asserts the stored `request_headers` does not contain it. Run locally (needs Postgres): `npm test` with `ASTRA_TEST_DATABASE_URL` set to an `astra_test_*` database (`test/database.ts`).
4. **Goal:** scope folders to their owner. **Check:** each folder query joins `collections` and filters `collections.user_id`; a test updating another user's folder expects 404 and an unchanged row.
5. **Goal:** add a minimal SSRF guard. **Check:** only `http:`/`https:` are allowed, the resolved IP is rejected if loopback, private or link-local, redirects are disabled or re-checked, and `maxContentLength` is set; a test proxying to `http://127.0.0.1:<port>` gets a 400 and no outbound request.

## Frontend

`client/src/App.tsx` mounts `pages/WorkbenchPage.tsx`, a dense three-panel tool UI:

- Left panel: collections tree (`features/collections/components/CollectionTree.tsx`) or request history (`features/history/components/HistoryPanel.tsx`).
- Center panel: request builder with URL bar, params, headers, body and auth (`client/src/features/request-builder/components/`).
- Right panel: response status, body, headers and timing (`features/response-viewer/components/ResponsePanel.tsx`).

CodeMirror is mounted in a reusable `client/src/components/ui/CodeEditor.tsx`, used by both `BodyEditor.tsx` and `ResponsePanel.tsx`, so request and response bodies share the same editor wiring.
