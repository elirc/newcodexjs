# Concepts explained from first principles

[Course index](README.md)

## The central idea: half-open time intervals and a shared write lock

Represent an appointment as the half-open interval [start,end). A 10:00–10:30 appointment and a 10:30–11:00 appointment are adjacent, not overlapping. The overlap predicate is existing.start < proposed.end AND existing.end > proposed.start. Using <= at both boundaries would reject valid back-to-back bookings.

The preflight conflict query is useful feedback but cannot settle concurrency. The model takes the provider lock, rechecks overlap and writes inside one transaction. Creation and rescheduling use the same provider coordination rule, so they cannot independently approve overlapping confirmed appointments. The provider lock deliberately favors a simple explanation over maximum parallelism.

The booking notification is a database row, not an email sent by this task. Inserting it inside the booking transaction ensures the two records commit together. Availability windows, booking buffers, advance-booking policy and cancelled-record rescheduling remain separate business rules; the tested guarantee is overlap protection and atomic booking confirmation, not full scheduling policy enforcement.

## Invariants: a precise way to describe correctness

An invariant is a rule that must remain true before and after an operation. “The app works” is too broad to test. “A failed import writes no records” or “editing preserves the record id” gives you something observable. For this project, derive your invariants from this behavior:

> Appointment creation and confirmed timing/status updates lock the provider before checking overlaps. Booking and its notification commit together. Conflicting reschedules leave the original appointment untouched.

Turn each sentence into a small state table. The columns are initial state, input, expected final state and expected feedback. Include one rejected input and one retry/repeated action where relevant. A useful invariant should be meaningful even if the implementation changes from an array to a database or from one UI component to another.

## Validation versus normalization

Validation rejects values the operation cannot accept. Normalization converts acceptable values to the representation the rest of the program expects. Trimming a comparison string is normalization; rejecting an empty required field is validation. Neither operation should silently invent facts. If a quantity is free-form text, do not guess a numerical interpretation. If an imported record is malformed, do not quietly save only the convenient subset unless that is the explicit product policy.

Apply this distinction to the data model:

Provider profiles belong to users and own services. Appointments reference provider, customer and service, with start_time/end_time/status/price. Availability rules supply candidate slots; notification rows describe booking events.

Which fields can be omitted? Which can be empty? Which have a bounded vocabulary? Which have stable identity? Write those answers down before adding another conditional. A schema is simply an explicit description of that expected shape and meaning.

## State transitions and failure boundaries

Every change has an ordering. If memory changes first and persistence fails, the UI can show data that will disappear after reload. If persistence succeeds first and rendering fails, the stored data may be correct while the screen is stale. There is no universal answer for every feature, but the choice must be deliberate and observable. The worked change makes one specific promise; the tests check that promise.

A promise represents an operation that completes later. `await` does not make it infallible or atomic; it gives the caller a place to handle success and rejection. Similarly, calling several functions inside one `try` block does not create a database transaction. Atomicity must come from a storage operation or transaction boundary that actually provides it.

## Identity, representation and derived values

Keep a stable id when updating an existing record. Compute display-only values from authoritative data when feasible, so there are fewer independently mutable facts to keep synchronized. Be careful when converting between strings and numbers: `Number('')` is zero, JSON cannot faithfully represent Infinity, and a date string can have different semantics from a timestamp. The specific conversions in this lesson are visible in the worked source, so step through them with a concrete value.

## Small design decisions deserve explanations

Before extracting a new abstraction, explain what repeated responsibility it would own. A helper that merely renames one expression may add little. A pure validator or one transaction boundary can make an important guarantee easier to test. Prefer an explanation tied to this project’s behavior over a rule such as “all code must use a particular pattern.”

Write a short decision note: “We chose X because it preserves Y under Z. It does not yet solve W.” Use the limitations in the worked example to fill in those letters. This is the beginning of engineering judgment: choosing a bounded solution and accurately describing its limits.

## Half-open intervals: why `start < otherEnd && end > otherStart`

A 30-minute appointment at 10:00 occupies `[10:00, 10:30)`: it includes 10:00 and excludes 10:30. Two appointments overlap exactly when each starts before the other ends: `newStart < existingEnd && newEnd > existingStart`. Work the four cases before you read the SQL in `ensureNoConflict`:

| existing | new | `newStart < existingEnd` | `newEnd > existingStart` | overlap? |
|---|---|---|---|---|
| 10:00-10:30 | 11:00-11:30 (disjoint) | 11:00 < 10:30 false | | no |
| 10:00-10:30 | 10:30-11:00 (adjacent) | 10:30 < 10:30 **false** | | no |
| 10:00-10:30 | 10:15-10:45 (partial) | 10:15 < 10:30 true | 10:45 > 10:00 true | yes |
| 10:00-11:00 | 10:15-10:45 (contained) | true | true | yes |

With `<=` and `>=` the adjacent case would be flagged as a conflict and back-to-back bookings would be impossible; the second test (`10:30` right after a `10:00` half-hour) depends on the strict comparison. The same predicate, written in SQL, is `start_time < ? AND end_time > ?` with the new end and start as parameters.

