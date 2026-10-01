# Solutions and engineering review

[Course index](README.md) · [Practice prompts](05-PRACTICE.md)

Attempt each exercise before using these notes. These are solution approaches and review criteria, not claims that every extension has been implemented. The actual completed behavior is described in the worked-change chapter.

## Existing implementation

Public reads and submissions enforce opening windows and capacity. Submission locks the survey, validates answers against its questions, writes response/answers and increments the counter in one transaction. Optional blank ratings stay null.

The key model is: A user owns surveys. A survey has questions, each with a question_type and optional choice rows/config. A response belongs to a survey; response_answers reference that response and its questions. response_count is a stored aggregate that must match accepted submissions.

The worked fixture should behave as follows: A required multi-choice question accepts JavaScript once even if it appears twice in the submitted array. Unknown, object and empty answers return 400 and create no response. Two submissions to max_responses=1 produce one 201 and one 400. Future, expired and closed surveys reject submissions.

## Extension solutions

### Exercise 1

**Prompt:** Display required-answer errors next to their questions.

**Approach:** Map question IDs to errors without replacing the respondent draft; keep the server check authoritative.

**Review:** errors must be keyed by question id from the server message or a structured `issues` array you add to `ValidationError`, rendered next to the matching `QuestionInput`, and the draft must survive the 400; a client test should assert that a required-answer error appears under the right question and disappears after the answer is filled.

### Exercise 2

**Prompt:** Add an answer-preview table before submission.

**Approach:** Build a read-only projection of the draft. Do not count a preview as a response or increment the counter.

**Review:** the preview must be a pure projection of `answers` (no request, no counter change: assert `response_count` unchanged after opening the preview in a server test, or `submitResponse` not called in a client test), and it must show the option label the server will validate against, not an index.

### Exercise 3

**Prompt:** Force the second answer insert to fail and verify the whole response rolls back.

**Approach:** Use a disposable-schema trigger and assert response rows, answer rows and counter all equal their pre-request values.

**Review:** install a `BEFORE INSERT` trigger on `response_answers` that raises on the second row (use `h.db.raw` in the test), send a valid two-question response, assert 500, then assert `responses`, `response_answers` and `surveys.response_count` all equal their pre-request values; explain which line of `createResponse` had already run when the error was raised.

### Exercise 4

**Prompt:** Define a policy for editing a question after responses exist.

**Approach:** Consider immutable question revisions. Existing answers should continue referencing the wording/options they answered; changing choices in place can distort results.

**Review:** the policy must say what happens to existing `response_answers` when an option is renamed or removed (`selected_option_id` becomes dangling or the row cascades), must propose immutable question revisions or a `retired_at` flag, and must show one SQL query that reports results correctly across a revision.

### Exercise 7 — ownership and authorization on the owner side

Reference helper (one query, reused by every owner-side write):

```typescript
async function assertOwner(surveyId: number, userId: number, trx = db) {
  const row = await trx("surveys").select("id").where({ id: surveyId, user_id: userId }).first();
  if (!row) throw new NotFoundError("Survey not found");
}
// e.g. in updateQuestion(questionId, userId, data):
const question = await db("questions").where({ id: questionId }).first();
if (!question) throw new NotFoundError("Question not found");
await assertOwner(question.survey_id, userId);
```

Reference test skeleton: insert user 2, create a survey and a question as user 1 (`{ "x-user-id": "1" }`), then `PUT /api/questions/<id>` as user 2 -> 404 and `SELECT title FROM questions WHERE id = <id>` unchanged; `POST /api/surveys/<sid>/questions` as user 2 -> 404 and question count unchanged; the same as user 1 -> 200/201.

Review: explain why the check is done by survey id even for question routes, why 404 rather than 403 here, and what would change if the demo header were replaced by a signed session (nothing in `assertOwner`; only where `userId` comes from).

## Review questions with answer guidance

**Why not trust input just because it came from this UI?** A caller can bypass the UI, a saved file can be edited, and older data can have a different shape. Validate at the boundary that owns the operation.

**Why keep the id stable?** It identifies the same domain record across views and edits. Changing it can create duplicates, disconnect child records or make reconciliation impossible.

**What makes the failure test meaningful?** It observes the promised state invariant. For this project, explain exactly why the failing scenario in [test/responses.test.ts](../test/responses.test.ts) would detect the original or a plausible regression.

**What does the test not prove?** A bounded suite does not prove all concurrency, browsers, deployment configurations or unrelated domain behavior. Name the real limitation from this lesson instead of adding a generic disclaimer.

**When should you extract a helper?** When it isolates a coherent responsibility, makes an invariant clearer or enables a meaningful test without duplicating application logic. A pure validator and a shared persistence boundary are common examples, but do not abstract solely to increase the number of files.

## A sample change explanation

“The previous behavior was: Unknown choices, empty required arrays and invalid ratings could be stored. Opening dates were not checked and the response limit was checked before the transaction. I changed the implementation so that: Public reads and submissions enforce opening windows and capacity. Submission locks the survey, validates answers against its questions, writes response/answers and increments the counter in one transaction. Optional blank ratings stay null. The strongest evidence is the regression that exercises the worked fixture and checks authoritative state. A remaining design question is the final stretch exercise.”

Replace that explanation with your own words and actual test results. A strong junior engineer can connect a concrete user problem to code, verification and a clearly stated limit. Completing that explanation independently is the final checkpoint for this course.
