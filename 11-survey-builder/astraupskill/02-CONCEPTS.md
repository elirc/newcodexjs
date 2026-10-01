# Concepts explained from first principles

[Course index](README.md)

## The central idea: nested validation and atomic response submission

Validation is a relationship problem here. A string can be valid text but an invalid choice for this question. Load the question definitions and check answer keys, requiredness, types and allowed choices before writing. A multi-choice array must contain known labels; deduplicate repeated selections. An optional blank rating means no answer, not zero. A required matrix must include each configured row and only configured columns.

The response counter is a second mutable fact. Insert the response and all its answers, then increment the counter using the same transaction. A late error must undo the earlier inserts. Capacity adds a concurrency rule: lock the survey row before checking response_count, so two requests cannot both take the last slot. The transaction reads the questions through the same connection.

The date window compares instants, unlike the domain apps' date-only fields. At the end timestamp the survey is closed. The access code is checked inside the submission transaction. The app still uses a demo owner header for administrative routes. Concurrent editing of question definitions and full administrative authorization deserve their own design; this change focuses on response acceptance.

## Invariants: a precise way to describe correctness

An invariant is a rule that must remain true before and after an operation. “The app works” is too broad to test. “A failed import writes no records” or “editing preserves the record id” gives you something observable. For this project, derive your invariants from this behavior:

> Public reads and submissions enforce opening windows and capacity. Submission locks the survey, validates answers against its questions, writes response/answers and increments the counter in one transaction. Optional blank ratings stay null.

Turn each sentence into a small state table. The columns are initial state, input, expected final state and expected feedback. Include one rejected input and one retry/repeated action where relevant. A useful invariant should be meaningful even if the implementation changes from an array to a database or from one UI component to another.

## Validation versus normalization

Validation rejects values the operation cannot accept. Normalization converts acceptable values to the representation the rest of the program expects. Trimming a comparison string is normalization; rejecting an empty required field is validation. Neither operation should silently invent facts. If a quantity is free-form text, do not guess a numerical interpretation. If an imported record is malformed, do not quietly save only the convenient subset unless that is the explicit product policy.

Apply this distinction to the data model:

A user owns surveys. A survey has questions, each with a question_type and optional choice rows/config. A response belongs to a survey; response_answers reference that response and its questions. response_count is a stored aggregate that must match accepted submissions.

Which fields can be omitted? Which can be empty? Which have a bounded vocabulary? Which have stable identity? Write those answers down before adding another conditional. A schema is simply an explicit description of that expected shape and meaning.

## State transitions and failure boundaries

Every change has an ordering. If memory changes first and persistence fails, the UI can show data that will disappear after reload. If persistence succeeds first and rendering fails, the stored data may be correct while the screen is stale. There is no universal answer for every feature, but the choice must be deliberate and observable. The worked change makes one specific promise; the tests check that promise.

A promise represents an operation that completes later. `await` does not make it infallible or atomic; it gives the caller a place to handle success and rejection. Similarly, calling several functions inside one `try` block does not create a database transaction. Atomicity must come from a storage operation or transaction boundary that actually provides it.

## Identity, representation and derived values

Keep a stable id when updating an existing record. Compute display-only values from authoritative data when feasible, so there are fewer independently mutable facts to keep synchronized. Be careful when converting between strings and numbers: `Number('')` is zero, JSON cannot faithfully represent Infinity, and a date string can have different semantics from a timestamp. The specific conversions in this lesson are visible in the worked source, so step through them with a concrete value.

## Small design decisions deserve explanations

Before extracting a new abstraction, explain what repeated responsibility it would own. A helper that merely renames one expression may add little. A pure validator or one transaction boundary can make an important guarantee easier to test. Prefer an explanation tied to this project’s behavior over a rule such as “all code must use a particular pattern.”

Write a short decision note: “We chose X because it preserves Y under Z. It does not yet solve W.” Use the limitations in the worked example to fill in those letters. This is the beginning of engineering judgment: choosing a bounded solution and accurately describing its limits.

## Why the lock is on the survey row

`submitResponse` (`server/src/services/surveyService.ts:176`) starts a transaction and immediately runs `SELECT ... FROM surveys WHERE public_token = ? FOR UPDATE`. Everything that decides whether this response may exist, the status, the date window, the access code and `response_count >= max_responses`, is read from that locked row, and the counter increment at the end of `createResponse` writes to the same row. A second respondent blocks on the lock until the first transaction commits, then re-reads the row and sees the incremented counter. That is why the capacity test observes exactly `[201, 400]` and `response_count = 1`.

Predict what breaks with the two obvious alternatives before you read on:

- **Lock the `responses` table instead.** Every survey now waits on every other survey's respondents, and the counter check still reads an unlocked `surveys` row, so two respondents can both see `0 < 1` and both insert. Coarser lock, and still wrong.
- **No lock, check then insert.** Both respondents read `0`, both insert, both increment: `response_count = 2` with `max_responses = 1`. The classic time-of-check-to-time-of-use race.

A third design, `UPDATE surveys SET response_count = response_count + 1 WHERE id = ? AND response_count < max_responses RETURNING *` as the *first* statement, avoids `FOR UPDATE` by making the increment itself the check. It is a good exercise 3 follow-up: which of the other checks (dates, access code) can move into that `WHERE`, and which cannot?

