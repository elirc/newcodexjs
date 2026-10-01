# Concepts explained from first principles

[Course index](README.md)

## The central idea: HTTP contracts, service validation and real SQL persistence

Each layer has a specific responsibility. A route chooses which operation handles a URL; a controller adapts HTTP input/output; a service enforces rules; a model issues SQL. Following one request is easier than reading every file alphabetically. The database is still the final authority for constraints, but expected bad input should produce a useful client error before a database exception. Number.isSafeInteger rejects values JavaScript cannot represent precisely; Number.isInteger alone is insufficient. Updates require context: the rule for setting a new due date should not prevent maintaining an already-overdue task. The unchanged-date exception is therefore narrow and compares against the stored date. The date column is a calendar date, so normalize it to YYYY-MM-DD instead of comparing display-formatted strings. Real HTTP-plus-database tests prove more than a mocked service test, but they still do not prove that every browser interaction is correct.

## Invariants: a precise way to describe correctness

An invariant is a rule that must remain true before and after an operation. “The app works” is too broad to test. “A failed import writes no records” or “editing preserves the record id” gives you something observable. For this project, derive your invariants from this behavior:

> The API rejects unsafe ids and titles longer than the database column. An unchanged existing due date remains editable; new or changed due dates still follow the future-date rule. Tests call real HTTP routes and inspect PostgreSQL rows, including completion timestamps and deletion.

Turn each sentence into a small state table. The columns are initial state, input, expected final state and expected feedback. Include one rejected input and one retry/repeated action where relevant. A useful invariant should be meaningful even if the implementation changes from an array to a database or from one UI component to another.

## Validation versus normalization

Validation rejects values the operation cannot accept. Normalization converts acceptable values to the representation the rest of the program expects. Trimming a comparison string is normalization; rejecting an empty required field is validation. Neither operation should silently invent facts. If a quantity is free-form text, do not guess a numerical interpretation. If an imported record is malformed, do not quietly save only the convenient subset unless that is the explicit product policy.

Apply this distinction to the data model:

A SQL task includes id, title, description, priority, status, due_date and completion timestamps. The database id is a positive integer. A partial update distinguishes an omitted field from a supplied null or value.

Which fields can be omitted? Which can be empty? Which have a bounded vocabulary? Which have stable identity? Write those answers down before adding another conditional. A schema is simply an explicit description of that expected shape and meaning.

## State transitions and failure boundaries

Every change has an ordering. If memory changes first and persistence fails, the UI can show data that will disappear after reload. If persistence succeeds first and rendering fails, the stored data may be correct while the screen is stale. There is no universal answer for every feature, but the choice must be deliberate and observable. The worked change makes one specific promise; the tests check that promise.

A promise represents an operation that completes later. `await` does not make it infallible or atomic; it gives the caller a place to handle success and rejection. Similarly, calling several functions inside one `try` block does not create a database transaction. Atomicity must come from a storage operation or transaction boundary that actually provides it.

## Identity, representation and derived values

Keep a stable id when updating an existing record. Compute display-only values from authoritative data when feasible, so there are fewer independently mutable facts to keep synchronized. Be careful when converting between strings and numbers: `Number('')` is zero, JSON cannot faithfully represent Infinity, and a date string can have different semantics from a timestamp. The specific conversions in this lesson are visible in the worked source, so step through them with a concrete value.

## Small design decisions deserve explanations

Before extracting a new abstraction, explain what repeated responsibility it would own. A helper that merely renames one expression may add little. A pure validator or one transaction boundary can make an important guarantee easier to test. Prefer an explanation tied to this project’s behavior over a rule such as “all code must use a particular pattern.”

Write a short decision note: “We chose X because it preserves Y under Z. It does not yet solve W.” Use the limitations in the worked example to fill in those letters. This is the beginning of engineering judgment: choosing a bounded solution and accurately describing its limits.
