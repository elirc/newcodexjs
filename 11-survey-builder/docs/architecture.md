# Architecture

Survey Builder is the first project in the series whose core object is defined by the user at runtime: a survey is a tree of questions (and options) that the public page renders from data. This document describes the code as it is, with `path:line` references you can open. Line numbers were checked on 2026-10-06; if you edit a file, re-check them.

## Layers

- `client/` is a React 18 Vite app using TypeScript, Axios, React Query and CSS Modules. All HTTP goes through `client/src/services/api.ts`; the four pages live in `client/src/features/surveys/`.
- `server/src/routes/surveyRoutes.ts` maps HTTP endpoints to controllers and attaches Zod validation with `validateBody(...)`. A local `wrap()` (`surveyRoutes.ts:56-60`) forwards async rejections to Express.
- `server/src/controllers/surveyController.ts` extracts params, the demo user id and the body, and returns the standard envelope through `sendSuccess` (`server/src/utils/http.ts:4`). Several controllers call the **model directly** (update survey, update/delete/reorder question, raw responses), skipping the service layer; see the findings below.
- `server/src/services/surveyService.ts` owns business rules: activation and public token creation, the accepting-responses check, typed answer validation, aggregation, CSV export and duplication.
- `server/src/models/surveyModel.ts` contains Knex-only database access.
- `server/src/middleware/` holds `validate.ts` (Zod body validation) and `errors.ts` (error classes and the error envelope).
- `server/src/config/env.ts` parses the environment with Zod at startup (`DATABASE_URL` must be a URL; `PORT` defaults to 4111).

## Data model

From `server/db/migrations/001_init.ts` (the only migration):

| Table | Key columns | Notes |
|---|---|---|
| `users` (5-10) | `email` unique, `display_name` | Seeded; no login flow. |
| `surveys` (11-31) | `user_id` FK cascade, `status` (`CHECK` draft/active/closed), `public_token` unique, `access_code`, `start_date`, `end_date`, `max_responses`, `response_count` default 0, `is_template` | `response_count` is a denormalized counter maintained by `createResponse`. |
| `questions` (32-50) | `survey_id` FK cascade, `question_type` (`CHECK` of 9 types), `is_required`, `sort_order`, `config` jsonb | `sort_order` has no unique constraint. |
| `question_options` (51-61) | `question_id` FK cascade, `label`, `sort_order` | Choice questions only. |
| `responses` (62-73) | `survey_id` FK cascade, `respondent_ip`, `started_at`, `completed_at` | One row per submission. |
| `response_answers` (74-96) | `response_id` and `question_id` FK cascade, `answer_text`, `selected_option_id`, `selected_option_ids integer[]`, `rating_value`, `matrix_answers` jsonb | One row per question per response; the column used depends on question type. |

`questions.config` holds type-specific settings: the builder writes `{min, max}` for rating and `{rows, columns}` for matrix (`SurveyBuilderPage.tsx:39`), and the seed also stores `{min: 0, max: 100, step: 1}` on a number question. Deleting a question cascades to its answers (`001_init.ts:82-87`), so results for an edited live survey silently lose history.

## API conventions

Successful responses use `{ "success": true, "data": ... }` (`utils/http.ts:4-6`). Errors thrown as `AppError` subclasses become `{ "success": false, "error": { "message", "code" } }` (`middleware/errors.ts:30-42`); `NotFoundError` is 404 `NOT_FOUND`, `ValidationError` is 400 `VALIDATION_ERROR`. Any other thrown error (for example a Postgres constraint violation or a `NaN` id) becomes 500 `APP_ERROR` "Unexpected server error".

One exception: the JSON-object guard in `server/src/app.ts:15-24` rejects a `POST`/`PUT`/`PATCH` without an object body with `{ "success": false, "error": "Send a JSON object." }`, where `error` is a string, not the usual object. A client that reads `error.message` gets `undefined` for this case.

## Identity and auth (as implemented)

There is no authentication. `userId(req)` in `surveyController.ts:7-9` reads `x-demo-user-id`, falling back to `DEMO_USER_ID` and then `1`. The client hard-codes `"x-demo-user-id": "1"` (`client/src/services/api.ts:4-7`). Ownership is enforced only where a query includes `user_id`: list, get, update, delete, activate and close survey, results and export (all via `findSurveyById`/`updateSurvey` with `{ id, user_id }`, `surveyModel.ts:25-58`). Public routes are identified only by the survey's `public_token`.

## Request trace: submitting a public response (the core write)

1. `PublicSurveyPage.tsx:13` builds a mutation that calls `surveyApi.submitResponse(token, { answers })`. Note it sends no `accessCode`.
2. `client/src/services/api.ts:42` posts to `/public/surveys/:token/responses` and `unwrap()`s the envelope (`api.ts:10-12`).
3. `server/src/app.ts:14` parses JSON (1 MB limit), `app.ts:15-24` rejects non-object bodies, and `app.ts:29` mounts the router at `/api`.
4. `surveyRoutes.ts:50-54` runs `validateBody(responseSchema)`; `responseSchema` (`validators/surveyValidators.ts:43-46`) only requires `answers` to be a string-keyed record. `validate.ts:6-16` returns only the **first** Zod issue's message as a 400.
5. `surveyController.ts:101-107` passes the token, `req.ip` and the body to the service and replies 201.
6. `surveyService.ts:171-193` opens a transaction and locks the survey row with `forUpdate()` (`:176-180`), then calls `assertAccepting` (`:158-168`: status, start/end window, `max_responses` against `response_count`), compares the access code (`:183-184`), reloads questions inside the same transaction (`:185`) and builds typed answer rows with `buildAnswerRows` (`:60-156`).
7. `surveyModel.ts:170-193` (`createResponse`) inserts the `responses` row, the `response_answers` rows and increments `surveys.response_count`, all on `trx`. Knex commits when the callback resolves.

Because every check reads the locked row, two respondents racing for the last slot serialize: the test "simultaneous respondents cannot exceed the last available slot" (`test/responses.test.ts:64`) expects statuses `[201, 400]` and `response_count = 1`.

## Senior findings (verified in source)

1. **Public survey endpoint leaks the access code.** `getPublicSurvey` returns `{ ...survey, questions }` (`surveyService.ts:52-57`), and `findSurveyByToken` selects every column (`surveyModel.ts:30-32`). The anonymous `GET /api/public/surveys/:token` response therefore includes `access_code` (and `user_id`). The access code protects nothing against someone who can load the form. Fix: project an explicit public shape.
2. **Question and response routes skip ownership.** `addQuestion` (`surveyController.ts:64-70` → `surveyService.ts:36-49`), `updateQuestion`/`deleteQuestion` (`surveyModel.ts:114-151`, `where({ id })` only), `reorderQuestions` (`surveyModel.ts:154-167`, scoped by survey but not user) and `getResponses` (`surveyController.ts:118-127` → `listResponses`) never check `user_id`. With the demo header, any user can edit another user's questions or read their raw responses by id.
3. **Results are aggregated in JavaScript, with lossy rules.** `getResults` loads every answer (`surveyModel.ts:213-218`) and counts in memory (`surveyService.ts:196-244`). Multi-choice labels are joined with `"; "` on write (`:115`) and split on `"; "` when counting (`:216`), so a label containing `"; "` is miscounted; ratings pass through `.filter(Boolean)` (`:222`), so a valid rating of `0` is dropped from the average.
4. **Export injection and truncation.** `csvCell` (`utils/http.ts:9-12`) quotes and doubles quotes but does not neutralize leading `=`, `+`, `-` or `@`, so a respondent's text can become a spreadsheet formula. `exportResponses` also reads at most 1000 responses (`surveyService.ts:249`) with no warning.

Smaller observations: the number type stores `{min, max}` in `config` but `buildAnswerRows` only checks `Number.isFinite` (`surveyService.ts:145-146`); `addQuestion` computes `max(sort_order) + 1` without locking (`:40-47`), so concurrent adds can share a position; and the bundled public page has no access-code field, so an access-coded survey cannot be answered from the UI. The test "an unparseable survey window is rejected at write time" (`test/responses.test.ts:122`) sends `x-user-id: 2`, a header the server never reads, so it actually runs as the fallback user; it still passes because it only checks status codes.

## Debugging scenario

Symptom: a respondent submits 8 on an owner's 0-10 rating question and gets 400 "Invalid answer for <question title>". Path: the 400 comes from `invalid()` in `buildAnswerRows` (`surveyService.ts:81-82`), rating branch `:118-127`. Check what the client sent: `PublicSurveyPage` stores answers keyed by question id, and the rating branch accepts a string or number that is an integer between `config.min ?? 1` and `config.max ?? 5`. The builder only ever writes `{min: 1, max: 5}` for new rating questions (`SurveyBuilderPage.tsx:39`), and the only way to change them is a `PUT /api/questions/:id` whose `config` `updateQuestion` writes as sent (`surveyModel.ts:121-126`). So the stored bounds can differ from what the owner believes, and the fallback when `config` is null is 1-5, which rejects 6-10. Confirm with `SELECT id, config FROM questions WHERE id = <id>;`.

## Exercise ladder (junior to mid)

1. **Goal:** find every place identity is read. **Check:** `grep -rn "x-demo-user-id\|DEMO_USER_ID" server/src client/src` lists `surveyController.ts:8`, `config/env.ts`, and `client/src/services/api.ts:6`, and no middleware.
2. **Goal:** confirm the access-code leak. **Check:** reading `surveyService.ts:52-57` and `surveyModel.ts:30-32`, there is no `.select(...)` or field removal between the row and the response. Run locally (needs Postgres): activate a survey with an access code and `curl` its public URL; expect `access_code` in `data`.
3. **Goal:** make the public projection safe. **Check:** after your change, `getPublicSurvey` returns only fields the form needs, and a new test asserts `data.access_code === undefined` (run with `npm test` and `ASTRA_TEST_DATABASE_URL` pointing at an `astra_test_*` database, as `test/database.ts:7-14` requires).
4. **Goal:** add ownership to question routes. **Check:** every model function that writes `questions` joins or pre-checks `surveys.user_id`; a test calling `PUT /api/questions/:id` with `x-demo-user-id: 2` against user 1's question expects 404 and an unchanged row.
5. **Goal:** move aggregation into SQL. **Check:** `getResults` issues a `GROUP BY` per question type instead of loading all answers, and the multi-choice count uses `selected_option_ids` (`unnest`) instead of splitting `answer_text`; results for the seed data match before and after.

## Tradeoffs

The app uses an `x-demo-user-id` header instead of authentication, which keeps the focus on the survey tree but leaves the ownership gaps above. Drag-and-drop is represented by Up/Down buttons in `SurveyBuilderPage.tsx` (labels at lines 126 and 129) that send the full ordered id list to the reorder endpoint, so no drag-and-drop package is needed.
