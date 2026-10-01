# Worked implementation and examples

[Course index](README.md)

## Before and after

**Before:** Unknown choices, empty required arrays and invalid ratings could be stored. Opening dates were not checked and the response limit was checked before the transaction.

**After:** Public reads and submissions enforce opening windows and capacity. Submission locks the survey, validates answers against its questions, writes response/answers and increments the counter in one transaction. Optional blank ratings stay null.

## Predict this example

A required multi-choice question accepts JavaScript once even if it appears twice in the submitted array. Unknown, object and empty answers return 400 and create no response. Two submissions to max_responses=1 produce one 201 and one 400. Future, expired and closed surveys reject submissions.

Before running anything, write the exact expected stored values and visible response. Include ids or record counts where they matter. Then run the focused tests and reproduce the matching UI/API action. Do not settle for seeing a success message: inspect the authoritative stored result as well.

## Actual implementation excerpt

The lines below are the ones Astra changed (compare `AstraOrganized2/astrafinalplan/implementation/batch04/backups/62/server/src/services/surveyService.ts` with `diff --strip-trailing-cr -w`): `submitResponse` now runs inside one transaction, locks the survey row with `FOR UPDATE` before `assertAccepting` reads the counter, and `buildAnswerRows` validates every answer against the question definitions before any insert. The linked source is authoritative if you later edit the project.

```typescript
// services/surveyService.ts:158
function assertAccepting(survey: any) {
  if (survey.status !== "active")
    throw new ValidationError("Survey is not accepting responses");
  const now = Date.now();
  if (survey.start_date && new Date(survey.start_date).getTime() > now)
    throw new ValidationError("Survey has not opened yet");
  if (survey.end_date && new Date(survey.end_date).getTime() <= now)
    throw new ValidationError("Survey has closed");
  if (survey.max_responses && survey.response_count >= survey.max_responses)
    throw new ValidationError("Survey response limit reached");
}


// services/surveyService.ts:171
/** Lock the survey before checking capacity; the answer rows and counter commit together. */
export async function submitResponse(
  token: string,
  ip: string | undefined,
  body: { accessCode?: string; answers: Record<string, unknown> },
) {
  return db.transaction(async (trx) => {
    const survey = await trx("surveys")
      .where({ public_token: token })
      .forUpdate()
      .first();
    if (!survey) throw new NotFoundError("Survey not found");
    assertAccepting(survey);
    if (survey.access_code && body.accessCode !== survey.access_code)
      throw new ValidationError("Invalid access code");
    const questions = await surveys.listQuestions(survey.id, trx);
    return surveys.createResponse(
      trx,
      survey.id,
      ip,
      buildAnswerRows(questions, body.answers),
    );
  });
```

## How to reason through the code

1. Identify the inputs. Distinguish data supplied by a caller from state read from storage or a trusted context.
2. Find the guard clauses. For each early return or thrown error, describe which invariant it protects and whether anything has already been written.
3. Find the candidate state or query. Explain whether it mutates an existing object or constructs a replacement.
4. Locate the persistence operation. For asynchronous code, follow the promise through success and rejection; for transactions, check that all related writes use the same transaction object.
5. Find the output or state publication. Ask what a repeated invocation would do after the first invocation succeeds.

Use this project-specific reasoning as your guide:

Validation is a relationship problem here. A string can be valid text but an invalid choice for this question. Load the question definitions and check answer keys, requiredness, types and allowed choices before writing. A multi-choice array must contain known labels; deduplicate repeated selections. An optional blank rating means no answer, not zero. A required matrix must include each configured row and only configured columns.

The response counter is a second mutable fact. Insert the response and all its answers, then increment the counter using the same transaction. A late error must undo the earlier inserts. Capacity adds a concurrency rule: lock the survey row before checking response_count, so two requests cannot both take the last slot. The transaction reads the questions through the same connection.

The date window compares instants, unlike the domain apps' date-only fields. At the end timestamp the survey is closed. The access code is checked inside the submission transaction. The app still uses a demo owner header for administrative routes. Concurrent editing of question definitions and full administrative authorization deserve their own design; this change focuses on response acceptance.

## Three variations to work through

**Normal variation — the last slot.** Create a survey with `max_responses: 2`, submit twice, then a third time. Predict: 201, 201, 400 `Survey response limit reached`, and `response_count = 2`. Read the row in `psql` between calls to see the counter move inside the same commit as the response.

**Invalid variation — an answer to a question that does not exist.** Submit `{ answers: { "999": "Yes" } }`. Predict: 400 `Unknown question`, and `SELECT count(*) FROM responses` unchanged. Then submit a `single_choice` answer whose label differs only in case from an option: predict whether `buildAnswerRows` accepts it (it compares labels exactly).

**Boundary variation — two respondents at once.** Reproduce the second test with `max_responses: 1` and two concurrent submits. Predict `[201, 400]` and `response_count = 1`. Then comment out `.forUpdate()` on a throwaway branch and repeat several times until you observe `[201, 201]` with `response_count = 2`; restore it and explain which read raced.

## Executable examples

These are the actual regression tests in [test/responses.test.ts](../test/responses.test.ts). Read each test as arrange → act → assert. Setup creates a controlled initial state, the action exercises the application code, and assertions compare observable behavior with an independently stated expectation.

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

## Explain it back

Give a five-minute walkthrough: the original problem, one invariant, the exact changed function, the most revealing failure test, and one remaining limitation. You should be able to explain why the implementation is correct for the worked example without reading the code aloud line by line.
