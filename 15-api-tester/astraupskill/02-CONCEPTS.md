# Concepts explained from first principles

[Course index](README.md)

## The central idea: atomic active selection and validating replacement collections

A transaction rolls back only if it fails. Returning undefined after clearing flags would commit the earlier update, even if the service later throws outside that transaction. Validate the target inside the transaction and throw there before clearing the old selection. The per-user lock also coordinates activation through metadata edits and creates.

Replacing a list is a common CRUD operation: delete the old children, insert the new children. Validate the complete candidate before deletion. Duplicate keys after trimming are ambiguous because interpolation needs one value per name; reject the candidate instead of silently choosing a winner. The endpoint intentionally accepts a JSON array, unlike most object-based CRUD requests. A blanket object-only middleware would break this valid contract.

Environment values may include secrets in normal use. The teaching examples use synthetic localhost URLs, not credentials. This task does not send proxy requests to external services. The project still uses a demo user header and has broader collection/folder ownership and proxy concerns outside this environment-focused change. The new guide separates these limitations from the implemented behavior.

## Invariants: a precise way to describe correctness

An invariant is a rule that must remain true before and after an operation. “The app works” is too broad to test. “A failed import writes no records” or “editing preserves the record id” gives you something observable. For this project, derive your invariants from this behavior:

> Environment create/update/activate serialize on the owner row. The target is verified before clearing active flags. Variable replacement locks its environment, rejects duplicate normalized keys and preserves the prior set on failure. Saved-request headers and parameters are serialized as JSONB arrays in seeds and CRUD writes.

Turn each sentence into a small state table. The columns are initial state, input, expected final state and expected feedback. Include one rejected input and one retry/repeated action where relevant. A useful invariant should be meaningful even if the implementation changes from an array to a database or from one UI component to another.

## Validation versus normalization

Validation rejects values the operation cannot accept. Normalization converts acceptable values to the representation the rest of the program expects. Trimming a comparison string is normalization; rejecting an empty required field is validation. Neither operation should silently invent facts. If a quantity is free-form text, do not guess a numerical interpretation. If an imported record is malformed, do not quietly save only the convenient subset unless that is the explicit product policy.

Apply this distinction to the data model:

Users own environments, which own env_variables. Exactly one environment is selected through the application activation paths, unless the user explicitly deactivates all. Variables have key, value, is_secret and sort_order. Saved requests and proxy history are separate domains.

Which fields can be omitted? Which can be empty? Which have a bounded vocabulary? Which have stable identity? Write those answers down before adding another conditional. A schema is simply an explicit description of that expected shape and meaning.

## State transitions and failure boundaries

Every change has an ordering. If memory changes first and persistence fails, the UI can show data that will disappear after reload. If persistence succeeds first and rendering fails, the stored data may be correct while the screen is stale. There is no universal answer for every feature, but the choice must be deliberate and observable. The worked change makes one specific promise; the tests check that promise.

A promise represents an operation that completes later. `await` does not make it infallible or atomic; it gives the caller a place to handle success and rejection. Similarly, calling several functions inside one `try` block does not create a database transaction. Atomicity must come from a storage operation or transaction boundary that actually provides it.

## Identity, representation and derived values

Keep a stable id when updating an existing record. Compute display-only values from authoritative data when feasible, so there are fewer independently mutable facts to keep synchronized. Be careful when converting between strings and numbers: `Number('')` is zero, JSON cannot faithfully represent Infinity, and a date string can have different semantics from a timestamp. The specific conversions in this lesson are visible in the worked source, so step through them with a concrete value.

## Small design decisions deserve explanations

Before extracting a new abstraction, explain what repeated responsibility it would own. A helper that merely renames one expression may add little. A pure validator or one transaction boundary can make an important guarantee easier to test. Prefer an explanation tied to this project’s behavior over a rule such as “all code must use a particular pattern.”

Write a short decision note: “We chose X because it preserves Y under Z. It does not yet solve W.” Use the limitations in the worked example to fill in those letters. This is the beginning of engineering judgment: choosing a bounded solution and accurately describing its limits.

## The owner-row lock: what it serializes, what it costs, and two alternatives

`activateEnvironment`, `createEnvironment` and `updateEnvironment` in `server/src/models/environmentModel.ts` all begin with `trx("users").where({ id: userId }).forUpdate().first()`. The invariant they protect is *one active environment per user*. Locking the user's row means every write that can change `is_active` for that user runs one at a time, so the sequence "clear all, then set one" (lines 80-85) can never interleave with another request's clear-then-set. The second test proves it: two activations in a `Promise.all` end with exactly one active row.

What it costs: the lock is on the *user*, so two unrelated writes by the same user (rename Staging, activate Local) also serialize, and the lock is held for the whole transaction including the `RETURNING *` round trip. For an API tester with one human per user that is invisible; for a shared account it would be a hot row. Two alternatives, both worth trying in a throwaway branch:

1. **Make the invariant a constraint.** `CREATE UNIQUE INDEX one_active_env_per_user ON environments (user_id) WHERE is_active;` Then the clear-then-set sequence still works, but a buggy code path that forgets the clear gets a unique-violation error instead of silently leaving two active rows. The lock becomes optional: without it, two racing activations both clear, both set, and the second `UPDATE ... SET is_active = true` fails with `23505`, which the service can map to 409 or retry.
2. **Lock the environment rows instead of the user row.** `SELECT ... FROM environments WHERE user_id = ? ORDER BY id FOR UPDATE` before the clear. Finer than the user row (a rename that does not touch `is_active` no longer waits), coarser than nothing, and the `ORDER BY id` matters for the same deadlock reason as in the checkout lesson.

Predict, before the exercise: with alternative 1 and no lock, what do two concurrent activations return? (One 200 and one 409/500, never two active rows.)

