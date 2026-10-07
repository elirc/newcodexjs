# Architecture

Every `path:line` below was opened and checked on 2026-10-06. Paths are relative to `05-recipe-manager/`.

## Shape

- `client/` is a React 18 + Vite TypeScript app using CSS Modules (`App.module.css`, `Pages.module.css`, `Button.module.css`) and an `AuthContext` (`client/src/context/AuthContext.tsx:16`) mounted inside `BrowserRouter` in `client/src/main.tsx:12`.
- `server/` is an Express TypeScript API built in `createApp()` (`server/src/app.ts:12`): `helmet`, CORS with `credentials: true` for `CLIENT_ORIGIN` (`server/src/app.ts:15`), signed-cookie-capable `cookieParser` (`server/src/app.ts:16`), auth routes at `/api/auth` and recipe routes at `/api` (`server/src/app.ts:20-21`), then the central `errorHandler` (`server/src/app.ts:22`).
- Layers: routes wrap controllers in `asyncHandler` (`server/src/middleware/asyncHandler.ts:4`); controllers only read `req` and call services; services hold validation, ownership and transaction boundaries; models hold Knex queries. Responses use `{ success: true, data }` (`server/src/utils/response.ts:4`) or `{ success: false, error: { message, code } }` (`server/src/middleware/errorHandler.ts:9`).
- One reversible migration (`server/db/migrations/001_initial_schema.ts:4` up, `:76` down). The seed creates 3 users, 8 categories, 20 recipes (each with 3 ingredients, 3 steps and 2 categories; indexes 0, 7 and 14 are private because `is_public: index % 7 !== 0`) and 4 favorites (`server/db/seeds/001_seed.ts:4`, `:18-24`, `:38-66`, `:68-73`).

## Auth flow (as implemented)

1. **Login/register.** `authService.login` compares the bcrypt hash (`server/src/services/authService.ts:52`), signs a 15-minute access JWT (`server/src/services/authService.ts:20`) and a 7-day refresh JWT (`server/src/services/authService.ts:25`), and stores only a bcrypt *hash* of the refresh token in `refresh_tokens` (`server/src/services/authService.ts:29-33`).
2. **Cookie.** The controller sets `refresh_token` as an HTTP-only, `sameSite: 'lax'` cookie, `secure` only in production (`server/src/controllers/authController.ts:6-11`, set at `:16` and `:23`). The access token goes back in the JSON body.
3. **Client storage.** `applySession` keeps the user in React state and installs the token as a default axios header (`client/src/context/AuthContext.tsx:20-23`, `client/src/services/api.ts:9-11`). Nothing is written to localStorage.
4. **Verification.** `requireAuth` takes the `Authorization: Bearer` header, or falls back to an `access_token` cookie that no server code ever sets (`server/src/middleware/auth.ts:9-13`), then `jwt.verify`s with `JWT_ACCESS_SECRET` (`server/src/middleware/auth.ts:20`). `optionalAuth` swallows bad tokens so public browsing still works (`server/src/middleware/auth.ts:28-37`).
5. **Restore on load.** `AuthProvider` calls `POST /auth/refresh` once on mount (`client/src/context/AuthContext.tsx:25-39`). The server verifies the refresh JWT, then bcrypt-compares it against every unexpired stored hash for that user (`server/src/services/authService.ts:63-68`, `server/src/models/userModel.ts:47`). It does **not** rotate the refresh token: it returns only a new access token (`server/src/services/authService.ts:71`).
6. **Gaps.** The client has no axios interceptor (`grep -rn interceptors client/src` → no matches), so after 15 minutes protected calls 401 until a full page reload. Logout deletes the matching hash (`server/src/services/authService.ts:75-81`).

## Data flow: create a recipe (core write)

| Hop | Code |
|---|---|
| Form builds payload; blank lines become ingredients/steps | `client/src/pages/CreateRecipePage.tsx:22-34` |
| Axios POST `/recipes` | `client/src/services/recipes.ts:35` |
| Route requires auth | `server/src/routes/recipeRoutes.ts:13` |
| Controller passes `req.user!.id` + body | `server/src/controllers/recipeController.ts:21-23` |
| Service validates, then opens the transaction | `server/src/services/recipeService.ts:81-85` (parse at `:17`, `db.transaction` at `:83`) |
| Model inserts the recipe, deletes and reinserts children | `server/src/models/recipeModel.ts:69-120` |
| Tables | `server/db/migrations/001_initial_schema.ts:15-64` |

Ownership comes only from the token, never the body. `saveRecipeGraph` writes `user_id: userId` (`server/src/models/recipeModel.ts:76`), and the test proves a forged `user_id` in the body is ignored (`server/test/ownership.test.ts:40`). Update locks the row with `forUpdate()` and checks the owner inside the same transaction (`server/src/services/recipeService.ts:89-96`). The final `getRecipe` read runs **after** commit, outside the transaction (`server/src/services/recipeService.ts:84`, `:97`). The earlier version of this doc said later reads were transactional. They are not.

## Data model (`server/db/migrations/001_initial_schema.ts`)

| Table | Key columns and constraints | Line |
|---|---|---|
| `users` | `username` varchar(50) unique, `email` varchar(255) unique, `password_hash`, timestamps | `:5` |
| `recipes` | `user_id` FK → users CASCADE; positive-check `prep_time_minutes`/`cook_time_minutes`/`servings`; `difficulty` CHECK in easy/medium/hard; `is_public` default **true** | `:15` |
| `ingredients` | `recipe_id` FK CASCADE, `name` varchar(200) not null, `sort_order` | `:30` |
| `steps` | `recipe_id` FK CASCADE, `step_number`, `instruction` text | `:39` |
| `categories` | `name`, `slug` both unique | `:47` |
| `recipe_categories` | composite PK (`recipe_id`, `category_id`), both CASCADE | `:53` |
| `favorites` | composite PK (`user_id`, `recipe_id`), `created_at` | `:59` |
| `refresh_tokens` | `user_id` FK CASCADE, `token_hash`, `expires_at` | `:66` |

The column default `is_public = true` (`:25`) contradicts the service default. In `server/src/services/recipeService.ts:55` an omitted `isPublic` means private. The API always sends an explicit value, but any raw insert (a seed, a script) gets the opposite default.

## Senior findings (verified 2026-10-06 by reading source)

1. **A missing or bad refresh cookie returns 500, not 401.** `refresh` and `logout` call `jwt.verify` without a try/catch (`server/src/services/authService.ts:64`, `:77`). `jwt.verify` throws a non-`AppError`, which `errorHandler` maps to 500 `INTERNAL_ERROR` (`server/src/middleware/errorHandler.ts:6-8`). So every logged-out page load logs a 500. On logout with an expired cookie, `res.clearCookie` (`server/src/controllers/authController.ts:30`) is never reached. Fix: catch the error and throw `UnauthorizedError`. In logout, always clear the cookie.
2. **The category filter truncates each recipe's `categories`.** `andWhere('c.slug', …)` (`server/src/models/recipeModel.ts:27`) filters the joined rows *before* `json_agg` (`:22`). A recipe in two categories therefore comes back listing only the filtered one. Fix: filter with `whereExists` on `recipe_categories` and leave the aggregate join alone.
3. **The favorite toggle is check-then-act.** `toggleFavorite` reads, then inserts (`server/src/models/recipeModel.ts:134-140`). Two concurrent POSTs, such as a double-click on the button in `client/src/pages/HomePage.tsx:25-28`, both see "absent", and the second insert hits the composite PK (`server/db/migrations/001_initial_schema.ts:63`), which surfaces as a 500. Fix: `insert … onConflict().ignore()` plus `delete … returning`, or make the endpoint an explicit PUT/DELETE.
4. **Register validation is thin.** `input.password.length` throws a TypeError (500) when `password` is missing (`server/src/services/authService.ts:37`). Only email duplicates are checked (`:38`), so a duplicate `username` hits the unique index (`server/db/migrations/001_initial_schema.ts:7`) and returns a 500. Non-numeric ids also go through `Number(req.params.id)` unchecked (`server/src/controllers/recipeController.ts:17`).

## Debugging scenario: "the seed worked yesterday, now it crashes"

**Symptom:** running `npm run seed` a second time fails with a foreign-key violation on `favorites`.
**Look:** `server/db/seeds/001_seed.ts:8-15` empties the tables with `del()` (a plain `DELETE`), which does not reset the `increments` sequences. The favorites are then inserted with hard-coded `recipe_id: 2, 4, 1, 6` (`server/db/seeds/001_seed.ts:68-73`). On the second run the recipes are numbered 21-40, so recipe 2 no longer exists.
**Fix:** reference `recipes[n].id` captured from `.returning('*')`, or truncate with `RESTART IDENTITY CASCADE`. To recover right now, use `npm run rollback`, then `migrate`, then `seed` (all three scripts are in `server/package.json`).

## Educational tradeoffs

The UI is compact. There is no edit or delete UI, even though the API supports both. `CreateRecipePage` has no error handling around `createRecipe`: a trailing blank line in the ingredients box sends `{ name: '' }`, the server rejects it with 400 (`server/src/services/recipeService.ts:58`), and the form shows nothing. Image uploads, refresh rotation and exhaustive client validation are left as next steps.

## Growth ladder

1. **Goal:** explain the two-token design. **Check:** `grep -n "expiresIn" server/src/services/authService.ts` prints exactly two lines, `:20` (`'15m'`) and `:25` (`'7d'`).
2. **Goal:** make `/auth/refresh` return 401 with no cookie (finding 1). **Check:** run locally (needs Postgres). Before the fix, `curl -i -X POST http://localhost:4005/api/auth/refresh` returns `500` with `"code":"INTERNAL_ERROR"`. After the fix it returns `401` with `"code":"UNAUTHORIZED"`.
3. **Goal:** keep categories intact under a filter (finding 2). **Check:** run locally. Every seeded recipe has 2 categories (`server/db/seeds/001_seed.ts:62-65`), so every recipe returned by `GET /api/recipes?category=dinner` should list 2. Today each lists 1.
4. **Goal:** make the favorite toggle idempotent under concurrency (finding 3). **Check:** add a test to `server/test/ownership.test.ts` that fires two `POST /api/recipes/:id/favorite` requests with `Promise.all`. Neither may return 500, and `favorites` must hold at most one row for the pair. The suite currently has 4 tests; run it with `ASTRA_TEST_DATABASE_URL=…/astra_test_x npm test` (the guard is in `server/test/database.cjs:4-9`).
5. **Goal:** add refresh rotation with reuse detection. **Check:** `grep -n "deleteRefreshToken" server/src/services/authService.ts` shows a call inside `refresh` (today the only call is in `logout`, `:80`), and a test shows a replayed old cookie getting 401.
