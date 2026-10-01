# Concepts explained from first principles

[Course index](README.md)

## The central idea: partial updates, JSON fields and recoverable forms

A create input and a stored record are different types. The database supplies identity and timestamps; the client should not resend those as editable fields. An update is a partial object: omitting `role` means retain it. Sending an empty `role` is rejected with 400, because `recordSchema` in `server/src/services/service.ts` declares `role: z.string().trim().min(1)`; the only field that can be cleared is `tags`, by sending an empty array. Constructing a full object full of defaults during an edit would erase omitted data.

A PostgreSQL JSONB column is not a PostgreSQL text array. The JavaScript driver can interpret an array parameter as a SQL array representation. JSON.stringify makes the intended JSON representation explicit; read the driver result after insertion to verify the round trip. The deduplication key is lowercase trimmed text, and the last spelling of an equivalent tag is retained. Status and domain-specific lane/stage fields remain bounded free-form strings; no unimplemented workflow engine is implied.

A browser search can have A and B in flight. If B finishes first, a later A response must not replace the newer result. The request sequence counter guards that publication step. A separate mutation guard prevents a rapid repeated save from sending another create. This is client request control, not server-side POST idempotency. Error feedback preserves a learner's draft so they can fix the problem and retry.

## Invariants: a precise way to describe correctness

An invariant is a rule that must remain true before and after an operation. “The app works” is too broad to test. “A failed import writes no records” or “editing preserves the record id” gives you something observable. For this project, derive your invariants from this behavior:

> Create and partial-update schemas validate editable fields. Tags are trimmed, bounded and deduplicated; the model serializes JSON arrays explicitly. The typed form offers cancel, saves only editable fields, prevents duplicate submissions, retains failed drafts and ignores stale search results. Seed tags use the same explicit JSON serialization.

Turn each sentence into a small state table. The columns are initial state, input, expected final state and expected feedback. Include one rejected input and one retry/repeated action where relevant. A useful invariant should be meaningful even if the implementation changes from an array to a database or from one UI component to another.

## Validation versus normalization

Validation rejects values the operation cannot accept. Normalization converts acceptable values to the representation the rest of the program expects. Trimming a comparison string is normalization; rejecting an empty required field is validation. Neither operation should silently invent facts. If a quantity is free-form text, do not guess a numerical interpretation. If an imported record is malformed, do not quietly save only the convenient subset unless that is the explicit product policy.

Apply this distinction to the data model:

Job Application Tracker stores applications with integer IDs and fields company, role, stage, status, tags. PostgreSQL persists rows; tags are JSONB. GET/POST /api/applications list/create and GET/PUT/DELETE /api/applications/:id read/change/remove a row. The success envelope wraps the record in data.

Which fields can be omitted? Which can be empty? Which have a bounded vocabulary? Which have stable identity? Write those answers down before adding another conditional. A schema is simply an explicit description of that expected shape and meaning.

## State transitions and failure boundaries

Every change has an ordering. If memory changes first and persistence fails, the UI can show data that will disappear after reload. If persistence succeeds first and rendering fails, the stored data may be correct while the screen is stale. There is no universal answer for every feature, but the choice must be deliberate and observable. The worked change makes one specific promise; the tests check that promise.

A promise represents an operation that completes later. `await` does not make it infallible or atomic; it gives the caller a place to handle success and rejection. Similarly, calling several functions inside one `try` block does not create a database transaction. Atomicity must come from a storage operation or transaction boundary that actually provides it.

## Identity, representation and derived values

Keep a stable id when updating an existing record. Compute display-only values from authoritative data when feasible, so there are fewer independently mutable facts to keep synchronized. Be careful when converting between strings and numbers: `Number('')` is zero, JSON cannot faithfully represent Infinity, and a date string can have different semantics from a timestamp. The specific conversions in this lesson are visible in the worked source, so step through them with a concrete value.

## Small design decisions deserve explanations

Before extracting a new abstraction, explain what repeated responsibility it would own. A helper that merely renames one expression may add little. A pure validator or one transaction boundary can make an important guarantee easier to test. Prefer an explanation tied to this project’s behavior over a rule such as “all code must use a particular pattern.”

Write a short decision note: “We chose X because it preserves Y under Z. It does not yet solve W.” Use the limitations in the worked example to fill in those letters. This is the beginning of engineering judgment: choosing a bounded solution and accurately describing its limits.
