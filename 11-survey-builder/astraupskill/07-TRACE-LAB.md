# Trace lab: Survey Builder: valid answers and response capacity

[Course index](README.md) · [Worked change](03-WORKED-CHANGE.md) · [Tests](04-TESTING-AND-DEBUGGING.md)

## Run it before you trace it

The first executable example from chapter 03, so the trace starts from a request you have actually sent:

```typescript
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { database, request } from "./database.js";
let h: Awaited<ReturnType<typeof database>>;
before(async () => {
  h = await database();
  await h
    .db("users")
    .insert({ id: 1, email: "learner@example.com", display_name: "Learner" });
});
after(async () => {
  if (h) await h.close();
});
const api = (path: string, method = "GET", body?: unknown) =>
  request(h.origin, "/api" + path, method, body);
async function survey(token: string, extra: object = {}) {
  return (
    await h
      .db("surveys")
      .insert({
        user_id: 1,
        title: token,
        status: "active",
        public_token: token,
        ...extra,
      })
      .returning("*")
  )[0];
}
test("typed choices reject invalid answers without creating a response", async () => {
  const s = await survey("choices");
  const [q] = await h
    .db("questions")
    .insert({
      survey_id: s.id,
      title: "Language",
      question_type: "multi_choice",
      is_required: true,
      sort_order: 1,
    })
    .returning("*");
  await h
    .db("question_options")
    .insert({ question_id: q.id, label: "JavaScript", sort_order: 1 });
  for (const value of [[], ["Unknown"], {}, true])
    assert.equal(
      (
        await api("/public/surveys/choices/responses", "POST", {
          answers: { [q.id]: value },
        })
      ).status,
      400,
    );
  assert.equal(Number((await h.db("responses").count("* as n").first()).n), 0);
  const r = await api("/public/surveys/choices/responses", "POST", {
    answers: { [q.id]: ["JavaScript", "JavaScript"] },
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  assert.equal(
    (await h.db("response_answers").first()).selected_option_ids.length,
    1,
  );
});
test("simultaneous respondents cannot exceed the last available slot", async () => {
  const s = await survey("capacity", { max_responses: 1 });
  const results = await Promise.all(
    [1, 2].map(() =>
      api("/public/surveys/capacity/responses", "POST", { answers: {} }),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 400]);
  assert.equal(
    (await h.db("surveys").where({ id: s.id }).first()).response_count,
    1,
  );
});
test("date windows and closed state reject responses, optional blank rating remains null", async () => {
  await survey("future", { start_date: "2099-01-01" });
  await survey("expired", { end_date: "2000-01-01" });
  await survey("closed", { status: "closed" });
  for (const token of ["future", "expired", "closed"])
    assert.equal(
      (await api(`/public/surveys/${token}/responses`, "POST", { answers: {} }))
        .status,
      400,
    );
  const s = await survey("rating");
  const [q] = await h
    .db("questions")
    .insert({
      survey_id: s.id,
      title: "Score",
      question_type: "rating",
      is_required: false,
      sort_order: 1,
      config: { min: 1, max: 5 },
    })
    .returning("*");
  assert.equal(
    (
      await api("/public/surveys/rating/responses", "POST", {
        answers: { [q.id]: 9 },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await api("/public/surveys/rating/responses", "POST", {
        answers: { [q.id]: "" },
      })
    ).status,
    201,
  );
  assert.equal(
    (await h.db("response_answers").where({ question_id: q.id }).first())
      .rating_value,
    null,
  );
});

test("an unparseable survey window is rejected at write time", async () => {
  await h.db("users").insert({ id: 2, email: "owner@example.com", display_name: "Owner" }).onConflict("id").ignore();
  const bad = await request(h.origin, "/api/surveys", "POST", {
    title: "Window",
    start_date: "next tuesday",
  }, { "x-user-id": "2" });
  assert.equal(bad.status, 400);
  const good = await request(h.origin, "/api/surveys", "POST", {
    title: "Window",
    start_date: "2099-01-01T00:00:00Z",
  }, { "x-user-id": "2" });
  assert.equal(good.status, 201, JSON.stringify(good.data));
});
```

Watch the server log while it runs, then follow the boundaries below with that exact request in mind.

## The concrete case

This lab connects one visible action to the code that accepts or rejects it. Use a disposable dataset and write your prediction before running the operation. The goal is to explain what each boundary contributes, not to memorize a sequence of clicks.

A required multi-choice question accepts JavaScript once even if it appears twice in the submitted array. Unknown, object and empty answers return 400 and create no response. Two submissions to max_responses=1 produce one 201 and one 400. Future, expired and closed surveys reject submissions.

## Write the record before touching the form

A user owns surveys. A survey has questions, each with a question_type and optional choice rows/config. A response belongs to a survey; response_answers reference that response and its questions. response_count is a stored aggregate that must match accepted submissions.

Make a small table in your own notes with these columns: field, starting value, proposed value, and source of truth. Include identity even when the form does not display it. Include related rows or stored counters when the operation changes more than one fact. Mark a value as derived if the app recomputes it rather than storing it independently.

For example, an edit can change a title while preserving an ID. A status command can keep the same status while producing no new history. An import can contain many rows yet be rejected before any replacement begins. In each case, the meaningful observation is the promised resulting state. A success toast alone cannot establish which fields changed.

## Trace the real call path

### Boundary 1 — the public form decides what to send

`client/src/features/surveys/PublicSurveyPage.tsx`: `answers` is a `Record<number, unknown>` filled by `QuestionInput` callbacks; the form's `onSubmit` calls `submit.mutate()`, a `useMutation` whose `mutationFn` is `surveyApi.submitResponse(token, { answers })`. The page renders "Thank you" only when `submit.isSuccess`, so a 400 leaves the draft on screen. Note that the client sends every answer it has, including blanks; deciding what blank means is the server's job.

### Boundary 2 — the request leaves the browser

`client/src/services/api.ts:42` posts to `/public/surveys/:token/responses` through the shared axios instance and `unwrap()`s the `{ success, data }` envelope. The token in the URL is the only identity a respondent has; there is no session and no user id on this path.

### Boundary 3 — the route validates the shape, the service validates the meaning

`server/src/routes/surveyRoutes.ts:51` mounts `validateBody(responseSchema)` (`middleware/validate.ts`): `answers` must be an object keyed by strings, nothing more. `buildAnswerRows` (`services/surveyService.ts:60`) then does the real work against the survey's questions: unknown question ids, missing required answers, choices that are not in `question.options`, ratings outside `config`, all throw `ValidationError` before any row is written. The first test sends each of those and asserts the `responses` table is unchanged.

### Boundary 4 — the service locks the survey and decides under the lock

`submitResponse` (line 176): `db.transaction` -> `trx("surveys").where({ public_token }).forUpdate().first()` -> `assertAccepting(survey)` (status, `start_date`, `end_date`, `max_responses` vs `response_count`) -> access code -> `listQuestions` with the same `trx` -> `buildAnswerRows`. All reads that feed a decision happen after the lock, which is what makes the capacity test deterministic.

### Boundary 5 — the model writes three things or nothing

`surveyModel.createResponse` (line 170) inserts the `responses` row, then the `response_answers` rows, then increments `response_count` and touches `updated_at` on the locked survey, all on `trx`. Knex commits when the callback resolves and rolls back when it throws; exercise 3 injects a trigger on the second insert and expects zero rows in all three tables.

### Boundary 6 — the envelope tells the respondent what happened

`utils/http.ts` `sendSuccess` answers 201 with the response row; `middleware/errors.ts` maps `ValidationError` to 400, `NotFoundError` to 404 and everything else to 500. In the browser, `useMutation` flips to `isSuccess` on 201 and exposes `error.message` otherwise; the page never re-reads the survey, because a respondent has nothing to re-read.

## Predict the regression scenarios

| Scenario from the executable suite | Prediction to write before running |
|---|---|
| typed choices reject invalid answers without creating a response | Initial records, request/input, expected result, and records that must remain unchanged. |
| simultaneous respondents cannot exceed the last available slot | Initial records, request/input, expected result, and records that must remain unchanged. |
| date windows and closed state reject responses, optional blank rating remains null | Initial records, request/input, expected result, and records that must remain unchanged. |

Open the test file and identify the arrange, act and assert portions. Arrange creates the synthetic starting state. Act calls the real boundary. Assert reads the observable result. Some tests repeat a call or issue two calls together; explain why a single ordinary call would miss that defect. Tests may share a deliberate fixture within one suite, so read setup and earlier scenario state before copying one case into a standalone script.

## A successful request, described precisely

Start with a valid fixture from the test. Copy the values into your own learning notes rather than copying a personal record. State which fields are required, which may be omitted and which have a special meaning when empty. Execute the operation once. Compare the response with a fresh authoritative read, then compare the UI with that read. If the UI is still loading, wait for the actual expected condition instead of guessing a fixed delay.

Record the stable ID and one changed field. Record at least one field that must remain the same. If the operation creates a child, record the parent ID stored on the child. If it updates an aggregate, compute the expected aggregate by hand. If it restores a backup, count retained, ignored and recreated records according to this project’s documented policy. These observations make a small example reusable when the implementation changes.

## A rejected request, described precisely

Now change one value to a rejected case named in the test suite. Keep everything else identical. Predict where validation fails. Run it and capture both the feedback and the authoritative state afterward. Compare the saved record, related rows and relevant counters with their pre-request values. A controlled error is useful only if the application also preserves the intended state.

Do not assume that all failures have the same status or message. Invalid input, missing records, conflicts and infrastructure errors represent different conditions. Read this app’s handler or parser to see the actual result. Browser-only parsers return a success/error union or throw an import error rather than returning an HTTP status. Translate the same correctness idea into the contract this app actually exposes.

## Read the storage boundary

The [test/database.ts](../test/database.ts) helper demonstrates migration-based isolation. It sets DATABASE_URL before importing the Knex connection and uses a unique PostgreSQL schema. The root workspace also makes pg and tsx available to the root test directory. A source import ending in .js is intentional: TypeScript resolves its .ts source during development and emitted Node code resolves .js after compilation.

Place a breakpoint immediately before the first write and another after the final write or publish step. On the success path, note what changed between those points. On the rejected-input path, the first write should never be reached when validation promises pre-write rejection. On a transactional failure path, some statements may execute and then roll back; reaching a write statement does not mean its effect committed.

An await marks a place where another operation can run. It does not itself define a transaction. When the test uses Promise.all, sketch request A and request B in two columns. Show where each acquires a lock or reads state. The test should accept either winner while insisting on the same final invariant. For synchronous or browser-only validation, explain why concurrency is outside the tested function rather than borrowing a database explanation that does not apply.

## Explain the design tradeoff

Validation is a relationship problem here. A string can be valid text but an invalid choice for this question. Load the question definitions and check answer keys, requiredness, types and allowed choices before writing. A multi-choice array must contain known labels; deduplicate repeated selections. An optional blank rating means no answer, not zero. A required matrix must include each configured row and only configured columns.

The response counter is a second mutable fact. Insert the response and all its answers, then increment the counter using the same transaction. A late error must undo the earlier inserts. Capacity adds a concurrency rule: lock the survey row before checking response_count, so two requests cannot both take the last slot. The transaction reads the questions through the same connection.

The date window compares instants, unlike the domain apps' date-only fields. At the end timestamp the survey is closed. The access code is checked inside the submission transaction. The app still uses a demo owner header for administrative routes. Concurrent editing of question definitions and full administrative authorization deserve their own design; this change focuses on response acceptance.

## Change one requirement independently

**Practice task:** Display required-answer errors next to their questions.

Before implementation, write three acceptance criteria: an ordinary successful case, a rejected or cancelled case, and a case that preserves existing behavior. Identify the smallest file boundary that owns the rule. Keep the existing regression suite; add a test only when it observes a new promise. Do not reproduce the implementation line by line inside the assertion, because both copies can contain the same mistake.

After a first attempt, compare your design with this hint: Map question IDs to errors without replacing the respondent draft; keep the server check authoritative.

## Debug a disagreement between layers

If the form and response disagree, inspect the request payload before editing the database code. If the response and database disagree, inspect the mapper, transaction and read query. If a test fails before an HTTP request is logged, inspect startup, environment variables and the test fixture. Missing dependencies, a busy port or an unavailable database are different from a failed business assertion. Preserve the first useful error and fix that cause before interpreting later cascading failures.

When a date looks wrong, distinguish a calendar label from an instant and check the serialization boundary. When an optional field will not clear, distinguish omission from an explicit empty/null value. When a list seems to lose a record, inspect filtering, sorting and pagination before assuming deletion. When history duplicates, compare desired-state commands with commands that represent a new event. These are diagnostic questions to apply to the actual fields above.

## Final independent checkpoint

Close this guide and give a five-minute walkthrough using only the application source and one test. Explain the user-visible problem, the input contract, the identity model, the write boundary, a failed operation and the remaining limitation. Then modify the worked fixture and predict the result without running it. Reopen the guide only after writing your answer.

A useful review note includes the exact command run, its result, and the boundary it covers. Keep browser interaction, simulated storage tests, real HTTP/database tests and compile checks distinct. The [verification page](VERIFICATION.md) records this delivery’s evidence. Exercises and proposed extensions in this course remain learner work; they are not counted as implemented features.
