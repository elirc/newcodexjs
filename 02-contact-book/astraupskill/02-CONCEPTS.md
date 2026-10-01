# Concepts explained from first principles

[Course index](README.md)

## The central idea: parsing state machines, batch validation and transactions

CSV looks like a string-splitting problem until a delimiter appears inside a value. Quoting changes how the next character must be interpreted, which makes a small state machine a good fit. Inside quotes, a newline belongs to the field; outside quotes, it ends a record. Two quotes inside a quoted field represent one literal quote. Parsing and domain validation are separate: a record can be syntactically correct CSV and still lack a required surname. Database constraints are a third boundary because a concurrent writer or existing email can invalidate an otherwise valid batch. All writes must use the transaction object; accidentally calling the global db for tag creation would let a tag survive rollback. Import is atomic, not globally idempotent: reimporting an existing non-null email fails as a whole, while contacts without unique emails can still be duplicated. Pagination also needs a stable id tie-breaker when many contacts share a surname.

## Invariants: a precise way to describe correctness

An invariant is a rule that must remain true before and after an operation. “The app works” is too broad to test. “A failed import writes no records” or “editing preserves the record id” gives you something observable. For this project, derive your invariants from this behavior:

> The parser supports quoted commas, doubled quotes, multiline text, CRLF and a BOM. It rejects malformed quoting, duplicate/unsupported headers and inconsistent field counts. The complete batch is validated before a single transaction writes contacts and tags. A late uniqueness failure rolls back earlier rows.

Turn each sentence into a small state table. The columns are initial state, input, expected final state and expected feedback. Include one rejected input and one retry/repeated action where relevant. A useful invariant should be meaningful even if the implementation changes from an array to a database or from one UI component to another.

## Validation versus normalization

Validation rejects values the operation cannot accept. Normalization converts acceptable values to the representation the rest of the program expects. Trimming a comparison string is normalization; rejecting an empty required field is validation. Neither operation should silently invent facts. If a quantity is free-form text, do not guess a numerical interpretation. If an imported record is malformed, do not quietly save only the convenient subset unless that is the explicit product policy.

Apply this distinction to the data model:

Contacts and tags have a many-to-many relationship through contact_tags. CSV headers are a supported allowlist; first_name and last_name are required. The tags field uses pipe-separated names. Email uniqueness also exists in PostgreSQL.

Which fields can be omitted? Which can be empty? Which have a bounded vocabulary? Which have stable identity? Write those answers down before adding another conditional. A schema is simply an explicit description of that expected shape and meaning.

## State transitions and failure boundaries

Every change has an ordering. If memory changes first and persistence fails, the UI can show data that will disappear after reload. If persistence succeeds first and rendering fails, the stored data may be correct while the screen is stale. There is no universal answer for every feature, but the choice must be deliberate and observable. The worked change makes one specific promise; the tests check that promise.

A promise represents an operation that completes later. `await` does not make it infallible or atomic; it gives the caller a place to handle success and rejection. Similarly, calling several functions inside one `try` block does not create a database transaction. Atomicity must come from a storage operation or transaction boundary that actually provides it.

## Identity, representation and derived values

Keep a stable id when updating an existing record. Compute display-only values from authoritative data when feasible, so there are fewer independently mutable facts to keep synchronized. Be careful when converting between strings and numbers: `Number('')` is zero, JSON cannot faithfully represent Infinity, and a date string can have different semantics from a timestamp. The specific conversions in this lesson are visible in the worked source, so step through them with a concrete value.

## Small design decisions deserve explanations

Before extracting a new abstraction, explain what repeated responsibility it would own. A helper that merely renames one expression may add little. A pure validator or one transaction boundary can make an important guarantee easier to test. Prefer an explanation tied to this project’s behavior over a rule such as “all code must use a particular pattern.”

Write a short decision note: “We chose X because it preserves Y under Z. It does not yet solve W.” Use the limitations in the worked example to fill in those letters. This is the beginning of engineering judgment: choosing a bounded solution and accurately describing its limits.
