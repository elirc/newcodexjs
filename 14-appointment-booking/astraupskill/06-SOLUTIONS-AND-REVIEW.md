# Solutions and engineering review

[Course index](README.md) · [Practice prompts](05-PRACTICE.md)

Attempt each exercise before using these notes. These are solution approaches and review criteria, not claims that every extension has been implemented. The actual completed behavior is described in the worked-change chapter.

## Existing implementation

Appointment creation and confirmed timing/status updates lock the provider before checking overlaps. Booking and its notification commit together. Conflicting reschedules leave the original appointment untouched.

The key model is: Provider profiles belong to users and own services. Appointments reference provider, customer and service, with start_time/end_time/status/price. Availability rules supply candidate slots; notification rows describe booking events.

The worked fixture should behave as follows: Two requests for 2099-01-01T10:00:00Z create one confirmed appointment and one 409 conflict. A 10:30 appointment succeeds. Moving it to 10:15 fails and leaves 10:30 stored. Reject notification inserts in the test schema and verify no booking is added.

## Extension solutions

### Exercise 1

**Prompt:** Explain the overlap predicate with four drawn intervals.

**Approach:** Cover disjoint, adjacent, partially overlapping and fully contained intervals; evaluate both inequalities for each.

**Review:** the four drawings must include the adjacent case and evaluate both inequalities for each; then run the second test with `<=` substituted on a throwaway branch and show that the adjacent booking becomes a 409, which is the observable consequence of getting the interval wrong.

### Exercise 2

**Prompt:** Add provider-local timezone labels to confirmation feedback.

**Approach:** Keep stored instants unchanged and format in the provider's timezone; include a daylight-saving transition example.

**Review:** stored instants (`start_time`, `end_time` as `timestamptz`) must not change; formatting must use the provider's `timezone` column with `Intl.DateTimeFormat` or `date-fns-tz`; your example must cross a daylight-saving transition and show the same instant rendered with two different wall-clock offsets.

### Exercise 3

**Prompt:** Test a booking competing with a reschedule into the same slot.

**Approach:** Start both requests against a known fixture and assert at most one confirmed overlap, regardless of which request wins.

**Review:** start a confirmed appointment A at 10:00 and another B at 11:00; run `book(10:30)` and `reschedule(B -> 10:30)` in a `Promise.all`; assert that at most one row occupies 10:30-11:00 afterwards, whichever won, and that the loser's row is unchanged (B still at 11:00 if it lost); explain that both paths take the provider lock before `ensureNoConflict`.

### Exercise 4

**Prompt:** Enforce all advertised availability and cancellation policies at the write boundary.

**Approach:** Use a common policy service under the appropriate lock. Define buffers, closed days, past times and reopening cancelled appointments explicitly rather than assuming the slot picker prevents direct API calls.

**Review:** the policy service must be called under the provider lock inside the model transaction (not only in the picker), must reject past times, closed days and buffer violations with 400 and slot conflicts with 409, and must state what happens when a cancelled appointment is reopened (it goes through `ensureNoConflict` again because `updateAppointment` re-checks when `next.status === "confirmed"`).

### Exercise 7 — ownership across the two roles

Reference for the provider-side check inside the transaction:

```typescript
// in updateAppointment(id, values, { providerId }) after the provider lock:
if (providerId !== undefined && found.provider_id !== providerId)
  throw new NotFoundError("Appointment not found");
```

Reference test skeleton: insert user 5 (customer) and book as 4; `api("/appointments/<id>/cancel", "POST", {}, { "x-user-id": "5" })` -> 404 and `status` still `confirmed`; insert a second provider profile for user 6 and call the provider status route as 6 -> 404; as 1 -> 200.

Review: explain why a customer-owned check can run before the transaction (a single-row update scoped by `customer_id` is enough) while the provider-side check belongs inside it (the same transaction re-checks overlaps).

## Review questions with answer guidance

**Why not trust input just because it came from this UI?** A caller can bypass the UI, a saved file can be edited, and older data can have a different shape. Validate at the boundary that owns the operation.

**Why keep the id stable?** It identifies the same domain record across views and edits. Changing it can create duplicates, disconnect child records or make reconciliation impossible.

**What makes the failure test meaningful?** It observes the promised state invariant. For this project, explain exactly why the failing scenario in [test/booking.test.ts](../test/booking.test.ts) would detect the original or a plausible regression.

**What does the test not prove?** A bounded suite does not prove all concurrency, browsers, deployment configurations or unrelated domain behavior. Name the real limitation from this lesson instead of adding a generic disclaimer.

**When should you extract a helper?** When it isolates a coherent responsibility, makes an invariant clearer or enables a meaningful test without duplicating application logic. A pure validator and a shared persistence boundary are common examples, but do not abstract solely to increase the number of files.

## A sample change explanation

“The previous behavior was: Two bookings could both pass the overlap query before either insert committed. A notification failure could leave a booking saved without its expected confirmation record. I changed the implementation so that: Appointment creation and confirmed timing/status updates lock the provider before checking overlaps. Booking and its notification commit together. Conflicting reschedules leave the original appointment untouched. The strongest evidence is the regression that exercises the worked fixture and checks authoritative state. A remaining design question is the final stretch exercise.”

Replace that explanation with your own words and actual test results. A strong junior engineer can connect a concrete user problem to code, verification and a clearly stated limit. Completing that explanation independently is the final checkpoint for this course.
