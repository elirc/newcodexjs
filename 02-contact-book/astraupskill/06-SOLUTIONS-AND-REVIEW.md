# Solutions and engineering review

[Course index](README.md) · [Practice prompts](05-PRACTICE.md)

Attempt each exercise before using these notes. These are solution approaches and review criteria, not claims that every extension has been implemented. The actual completed behavior is described in the worked-change chapter.

## Existing implementation

The parser supports quoted commas, doubled quotes, multiline text, CRLF and a BOM. It rejects malformed quoting, duplicate/unsupported headers and inconsistent field counts. The complete batch is validated before a single transaction writes contacts and tags. A late uniqueness failure rolls back earlier rows.

The key model is: Contacts and tags have a many-to-many relationship through contact_tags. CSV headers are a supported allowlist; first_name and last_name are required. The tags field uses pipe-separated names. Email uniqueness also exists in PostgreSQL.

The worked fixture should behave as follows: Import a company "Labs, Inc." and notes containing a newline and the words She said "hello". The stored strings must be intact. In another batch, insert a new email and TemporaryTag, then repeat that email in row two: no contact or TemporaryTag from that batch may remain.

## Extension solutions

### Exercise 1

**Prompt:** Return a preview of row errors without writing any data.

**Approach:** Keep parsing and validation pure, collect bounded row-numbered errors, and reserve the transaction for a separately confirmed valid batch.

**Review:** the HTTP test must post through `/api/contacts/import` (not call the service) and assert 200 with `data.imported` and 400 with an unchanged `contacts` count; explain which layer produced the 400 (the parser's `ValidationError`, mapped by the error middleware).

### Exercise 2

**Prompt:** Define a duplicate-email import policy that supports deliberate updates.

**Approach:** Choose skip/update/reject explicitly. An upsert must specify which fields may change and what happens to tags; do not silently reinterpret an import as destructive replacement.

**Review:** the batched import must keep the rollback test green unchanged; show the timing before and after for 200 rows and name the PostgreSQL guarantee (`RETURNING` order for one multi-row insert) that lets you map rows back to tags.

### Exercise 3

**Prompt:** Add a quoted carriage-return round-trip fixture.

**Approach:** Include a quoted field containing a carriage return and verify export quotes it and import preserves its content.

**Review:** the late-failure test must inject the failure *after* at least one contact and one junction were inserted (the third test does this with a uniqueness violation) and assert all three tables are unchanged; explain why a per-row transaction would have left partial data.

### Exercise 4

**Prompt:** Investigate CSV spreadsheet-formula handling for a separate export policy.

**Approach:** A spreadsheet may evaluate a leading =, +, - or @ even when CSV quoting is correct. Define whether this app exports raw data or spreadsheet-safe text and test that policy independently from CSV syntax.

**Review:** the pagination test must create equal-name contacts, page twice and assert identical ids in identical order (a tie-breaker on `id`), and must show that `page=0` or `pageSize=1000` is a 400 rather than a silent clamp (or document the clamp if that is the contract).

### Exercise 8 — batch the import without losing the rollback

Reference shape:

```js
async function importContactBatch(batch) {
  return db.transaction(async (trx) => {
    const created = await trx("contacts").insert(batch.map((b) => b.contact)).returning("*");
    const names = [...new Set(batch.flatMap((b) => b.tags))];
    if (names.length) await trx("tags").insert(names.map((name) => ({ name }))).onConflict("name").ignore();
    const tags = names.length ? await trx("tags").whereIn("name", names) : [];
    const byName = new Map(tags.map((t) => [t.name, t]));
    const junctions = batch.flatMap((b, i) => b.tags.map((name) => ({ contact_id: created[i].id, tag_id: byName.get(name).id })));
    if (junctions.length) await trx("contact_tags").insert(junctions);
    return created.map((c, i) => ({ ...c, tags: batch[i].tags.map((n) => byName.get(n)) }));
  });
}
```

Review: `created[i]` relies on PostgreSQL returning rows in insert order for a single multi-row `INSERT ... RETURNING`, which it does; say so explicitly. The rollback test is the acceptance criterion because it is the property most likely to be lost while optimizing.

### Exercise 7 — ownership and authorization

Reference: in `importContacts`, after parsing, `rows.forEach((r) => { r.contact.owner = actor; })`; in `contactModel.listContacts(filters, actor)` add `.where({ owner: actor })`; `getContact(id, actor)` -> `.where({ id, owner: actor }).first()` and 404 when missing.

Reference test skeleton: `api.request("POST", "/api/contacts/import", { csv }, { "X-Actor": "ana" })` -> 200; `api.request("GET", "/api/contacts", undefined, { "X-Actor": "ben" })` -> `data` empty; `GET /api/contacts/<id>` as `ben` -> 404; as `ana` -> 200.

Review: a CSV column named `owner` must be ignored (or rejected), otherwise an import file can assign contacts to someone else.

## Review questions with answer guidance

**Why not trust input just because it came from this UI?** A caller can bypass the UI, a saved file can be edited, and older data can have a different shape. Validate at the boundary that owns the operation.

**Why keep the id stable?** It identifies the same domain record across views and edits. Changing it can create duplicates, disconnect child records or make reconciliation impossible.

**What makes the failure test meaningful?** It observes the promised state invariant. For this project, explain exactly why the failing scenario in [server/test/import.test.cjs](../server/test/import.test.cjs) would detect the original or a plausible regression.

**What does the test not prove?** A bounded suite does not prove all concurrency, browsers, deployment configurations or unrelated domain behavior. Name the real limitation from this lesson instead of adding a generic disclaimer.

**When should you extract a helper?** When it isolates a coherent responsibility, makes an invariant clearer or enables a meaningful test without duplicating application logic. A pure validator and a shared persistence boundary are common examples, but do not abstract solely to increase the number of files.

## A sample change explanation

“The previous behavior was: The old parser split lines and commas directly, corrupting quoted commas and multiline fields. Import inserted one contact at a time, skipped some invalid rows and did not make the whole batch atomic. I changed the implementation so that: The parser supports quoted commas, doubled quotes, multiline text, CRLF and a BOM. It rejects malformed quoting, duplicate/unsupported headers and inconsistent field counts. The complete batch is validated before a single transaction writes contacts and tags. A late uniqueness failure rolls back earlier rows. The strongest evidence is the regression that exercises the worked fixture and checks authoritative state. A remaining design question is the final stretch exercise.”

Replace that explanation with your own words and actual test results. A strong junior engineer can connect a concrete user problem to code, verification and a clearly stated limit. Completing that explanation independently is the final checkpoint for this course.
