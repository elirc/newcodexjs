# Concepts explained from first principles

[Course index](README.md)

## The central idea: preserving workflow state and atomic multi-record changes

Archive is a lifecycle operation with two related facts: a status and an archived timestamp. Setting one without the other makes filters disagree with the badge. The statusFields helper synchronizes those fields whether the request came from an archive button, a form or a bulk command. Restoring should return a listings record to its previous workflow state. A legacy archived row without the new saved field falls back to draft; the migration does not invent a historical state it cannot know.

Bulk editing should have explicit missing-target semantics. This implementation rejects the whole batch when any requested record is missing or soft-deleted. It deduplicates IDs before comparing lengths, locks targets in ID order and skips rows already at the desired status. Every changed record receives an audit entry with the actual previous and resulting values. A misleading before:null would make it harder to explain what changed.

The server validates partial fields before writing and keeps IDs stable. The version increments on change, but this is not yet optimistic concurrency: a client does not send an expected version. A row lock serializes writes; it does not detect a stale full-form edit. The role header is a demo mechanism, and vendor_id is a grouping foreign key rather than an enforced tenant boundary. The scaffold demonstrates administration, not every operational feature suggested by its product name.

## Invariants: a precise way to describe correctness

An invariant is a rule that must remain true before and after an operation. “The app works” is too broad to test. “A failed import writes no records” or “editing preserves the record id” gives you something observable. For this project, derive your invariants from this behavior:

> Archive stores the previous status in an additive migration, restore returns to that status, and repeats are no-ops. Ordinary and bulk status changes keep archive flags consistent. Bulk IDs are deduplicated; all targets are locked and checked before any change. Audit rows contain real before/after records. List refreshes ignore stale responses and use the current filters after a mutation; failed saves retain the draft and show an error.

Turn each sentence into a small state table. The columns are initial state, input, expected final state and expected feedback. Include one rejected input and one retry/repeated action where relevant. A useful invariant should be meaningful even if the implementation changes from an array to a database or from one UI component to another.

## Validation versus normalization

Validation rejects values the operation cannot accept. Normalization converts acceptable values to the representation the rest of the program expects. Trimming a comparison string is normalization; rejecting an empty required field is validation. Neither operation should silently invent facts. If a quantity is free-form text, do not guess a numerical interpretation. If an imported record is malformed, do not quietly save only the convenient subset unless that is the explicit product policy.

Apply this distinction to the data model:

listings belong to the grouping reference vendor_id. Records have title, owner, priority, status, metadata, due_at, risk_level, version, archived_at and deleted_at. Status vocabulary: draft, active, flagged, paused, archived. The new nullable status_before_archive column remembers the earlier state. Comments, activity_events and audit_log reference records.

Which fields can be omitted? Which can be empty? Which have a bounded vocabulary? Which have stable identity? Write those answers down before adding another conditional. A schema is simply an explicit description of that expected shape and meaning.

## State transitions and failure boundaries

Every change has an ordering. If memory changes first and persistence fails, the UI can show data that will disappear after reload. If persistence succeeds first and rendering fails, the stored data may be correct while the screen is stale. There is no universal answer for every feature, but the choice must be deliberate and observable. The worked change makes one specific promise; the tests check that promise.

A promise represents an operation that completes later. `await` does not make it infallible or atomic; it gives the caller a place to handle success and rejection. Similarly, calling several functions inside one `try` block does not create a database transaction. Atomicity must come from a storage operation or transaction boundary that actually provides it.

## Identity, representation and derived values

Keep a stable id when updating an existing record. Compute display-only values from authoritative data when feasible, so there are fewer independently mutable facts to keep synchronized. Be careful when converting between strings and numbers: `Number('')` is zero, JSON cannot faithfully represent Infinity, and a date string can have different semantics from a timestamp. The specific conversions in this lesson are visible in the worked source, so step through them with a concrete value.

## Small design decisions deserve explanations

Before extracting a new abstraction, explain what repeated responsibility it would own. A helper that merely renames one expression may add little. A pure validator or one transaction boundary can make an important guarantee easier to test. Prefer an explanation tied to this project’s behavior over a rule such as “all code must use a particular pattern.”

Write a short decision note: “We chose X because it preserves Y under Z. It does not yet solve W.” Use the limitations in the worked example to fill in those letters. This is the beginning of engineering judgment: choosing a bounded solution and accurately describing its limits.
