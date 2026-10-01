# Worked implementation and examples

[Course index](README.md)

## Before and after

**Before:** The old parser split lines and commas directly, corrupting quoted commas and multiline fields. Import inserted one contact at a time, skipped some invalid rows and did not make the whole batch atomic.

**After:** The parser supports quoted commas, doubled quotes, multiline text, CRLF and a BOM. It rejects malformed quoting, duplicate/unsupported headers and inconsistent field counts. The complete batch is validated before a single transaction writes contacts and tags. A late uniqueness failure rolls back earlier rows.

## Predict this example

Import a company "Labs, Inc." and notes containing a newline and the words She said "hello". The stored strings must be intact. In another batch, insert a new email and TemporaryTag, then repeat that email in row two: no contact or TemporaryTag from that batch may remain.

Before running anything, write the exact expected stored values and visible response. Include ids or record counts where they matter. Then run the focused tests and reproduce the matching UI/API action. Do not settle for seeing a success message: inspect the authoritative stored result as well.

## Actual implementation excerpt

The excerpt below comes from [server/src/utils/csv.js](../server/src/utils/csv.js) near line 11. It is a teaching snapshot; the linked source is authoritative if you later edit the project. Read surrounding code for callers and setup.

```javascript
function csvToContacts(csv) {
    if (typeof csv !== 'string' || !csv.trim())
        throw new ValidationError('CSV text is required');
    const text = csv.replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    let closed = false;
    function endField() { row.push(field); field = ''; closed = false; }
    function endRow() {
        endField();
        if (row.some((value) => value.trim()))
            rows.push(row);
        row = [];
    }
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (quoted) {
            if (char === '"' && text[i + 1] === '"') {
                field += '"';
                i++;
            }
            else if (char === '"') {
                quoted = false;
                closed = true;
            }
            else
                field += char;
        }
        else if (char === ',')
            endField();
        else if (char === '\n' || char === '\r') {
            if (char === '\r' && text[i + 1] === '\n')
                i++;
            endRow();
        }
        else if (closed) {
            throw new ValidationError('Unexpected text after a closing CSV quote');
        }
        else if (char === '"') {
            if (field.length)
                throw new ValidationError('A quoted CSV field must start with a quote');
            quoted = true;
        }
        else
            field += char;
    }
    if (quoted)
        throw new ValidationError('Unclosed CSV quote');
    if (field.length || row.length || closed)
        endRow();
    const headers = (rows.shift() || []).map((value) => value.trim());
    if (!headers.includes('first_name') || !headers.includes('last_name'))
        throw new ValidationError('CSV headers must include first_name and last_name');
    if (new Set(headers).size !== headers.length || headers.some((key) => !HEADERS.includes(key)))
        throw new ValidationError('CSV has duplicate or unsupported headers');
    if (!rows.length || rows.length > 1000)
        throw new ValidationError('Import between 1 and 1000 contacts at a time');
    return rows.map((values, index) => {
        if (values.length !== headers.length)
            throw new ValidationError(`CSV record ${index + 2} has the wrong number of fields`);
        return Object.fromEntries(headers.map((key, i) => [key, values[i]]));
    });
}
module.exports = { contactsToCsv, csvToContacts };
```

## Performance is a separate concern from correctness

`importContactBatch` in `server/src/models/contactModel.js` (lines 160-176) is correct and slow: for every contact it runs one `INSERT ... RETURNING *`, then for every tag an `INSERT ... ON CONFLICT ... IGNORE`, a `SELECT`, and a junction `INSERT`. A 1,000-row file with three tags each is about 10,000 round trips inside one transaction. That is fine for a course and wrong for production, and the two are different lessons: the transaction gives all-or-nothing, the batching gives speed. Exercise 8 asks for the batched version with the *same* rollback test as its acceptance criterion, so you can prove you kept correctness while changing performance.

## How to reason through the code

1. Identify the inputs. Distinguish data supplied by a caller from state read from storage or a trusted context.
2. Find the guard clauses. For each early return or thrown error, describe which invariant it protects and whether anything has already been written.
3. Find the candidate state or query. Explain whether it mutates an existing object or constructs a replacement.
4. Locate the persistence operation. For asynchronous code, follow the promise through success and rejection; for transactions, check that all related writes use the same transaction object.
5. Find the output or state publication. Ask what a repeated invocation would do after the first invocation succeeds.

Use this project-specific reasoning as your guide:

CSV looks like a string-splitting problem until a delimiter appears inside a value. Quoting changes how the next character must be interpreted, which makes a small state machine a good fit. Inside quotes, a newline belongs to the field; outside quotes, it ends a record. Two quotes inside a quoted field represent one literal quote. Parsing and domain validation are separate: a record can be syntactically correct CSV and still lack a required surname. Database constraints are a third boundary because a concurrent writer or existing email can invalidate an otherwise valid batch. All writes must use the transaction object; accidentally calling the global db for tag creation would let a tag survive rollback. Import is atomic, not globally idempotent: reimporting an existing non-null email fails as a whole, while contacts without unique emails can still be duplicated. Pagination also needs a stable id tie-breaker when many contacts share a surname.

## Three variations to work through

- **Normal variation — a field that is only a quoted empty string.** Import `first_name,last_name,email,notes\r\nGrace,Hopper,grace@example.com,""`. Predict: one contact, `notes` is an empty string (or `null` if the normalizer converts it; read `csvToContacts` to decide before running).

- **Invalid variation — a row ending in a bare `\r`.** Import `first_name,last_name,email\r\nAda,Lovelace,ada@example.com\r`. Predict whether the parser treats the trailing `\r` as a line ending or as part of the email, and therefore whether the row is valid; then check with the email validation rule.

- **Boundary variation — duplicate headers.** Import a file whose header row is `first_name,last_name,email,notes,notes`. Predict the exact error from the header check in `server/src/utils/csv.js` and that no transaction is opened (count `contacts` before and after).

## Executable examples

These are the actual regression tests in [server/test/import.test.cjs](../server/test/import.test.cjs). Read each test as arrange → act → assert. Setup creates a controlled initial state, the action exercises the application code, and assertions compare observable behavior with an independently stated expectation.

```javascript
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const harness = require("./database.cjs");
harness.configure();
const db = require("../src/config/db");
const service = require("../src/services/contactService");
const app = require("../src/app");
const { csvToContacts, contactsToCsv } = require("../src/utils/csv");
let clean, api;
before(async () => {
  clean = await harness.prepare(
    db,
    require("../db/migrations/202607030201_create_contacts_tags").up,
  );
  api = await harness.listen(app);
});
after(async () => {
  if (api) await api.close();
  if (clean) await clean();
});
test("quoted commas, doubled quotes, multiline notes and CRLF round-trip with tags", async () => {
  const csv =
    'first_name,last_name,email,company,notes,tags\r\nAda,Lovelace,ada@example.com,"Labs, Inc.","Line one\nShe said ""hello""",Friend|Colleague';
  const result = await service.importContacts(csv);
  assert.equal(result.imported, 1);
  const contact = await service.getContact(result.contacts[0].id);
  assert.equal(contact.company, "Labs, Inc.");
  assert.equal(contact.notes, 'Line one\nShe said "hello"');
  assert.deepEqual(
    contact.tags.map((tag) => tag.name),
    ["Colleague", "Friend"],
  );
  assert.equal(csvToContacts(contactsToCsv([contact]))[0].notes, contact.notes);
});
test("malformed late record rejects the entire batch without saving the earlier valid contact", async () => {
  const before = Number((await db("contacts").count("* as n").first()).n);
  for (const csv of [
    "first_name,last_name\nGrace,Hopper\nInvalid",
    "first_name,last_name\nGrace,Hopper\n,Missing",
    'first_name,last_name\n"Unclosed,Hopper',
    "first_name,first_name,last_name\nA,B,C",
  ])
    await assert.rejects(() => service.importContacts(csv));
  assert.equal(
    Number((await db("contacts").count("* as n").first()).n),
    before,
  );
});
test("a late database uniqueness failure rolls back contacts, new tags and junctions", async () => {
  await assert.rejects(
    () =>
      service.importContacts(
        "first_name,last_name,email,tags\nFirst,Person,rollback@example.com,TemporaryTag\nSecond,Person,rollback@example.com,OtherTag",
      ),
    /no contacts were imported/,
  );
  assert.equal(
    (await db("contacts").where({ email: "rollback@example.com" })).length,
    0,
  );
  assert.equal(
    (await db("tags").whereIn("name", ["TemporaryTag", "OtherTag"])).length,
    0,
  );
});
test("equal-name contacts page deterministically and bad pagination is rejected", async () => {
  await service.importContacts(
    "first_name,last_name,company\nA,Tie,PageFixture\nB,Tie,PageFixture\nC,Tie,PageFixture",
  );
  const a = await service.listContacts({
    search: "PageFixture",
    page: 1,
    limit: 2,
  });
  const b = await service.listContacts({
    search: "PageFixture",
    page: 2,
    limit: 2,
  });
  assert.equal(a.pagination.total, 3);
  assert.equal(
    new Set([...a.contacts, ...b.contacts].map((x) => x.id)).size,
    3,
  );
  await assert.rejects(() => service.listContacts({ page: "nope" }));
  await assert.rejects(() => service.listContacts({ limit: 1.5 }));
});

test("POST /api/contacts/import answers 200 for a good CSV and 400 for a malformed one, through the controller", async () => {
  const good = await api.request("POST", "/api/contacts/import", {
    csv: "first_name,last_name,email\r\nGrace,Hopper,grace@example.com",
  });
  assert.equal(good.status, 200, JSON.stringify(good.body));
  assert.equal(good.body.data.imported, 1);
  const before = Number((await db("contacts").count("* as n").first()).n);
  const bad = await api.request("POST", "/api/contacts/import", {
    csv: 'first_name,last_name,email\r\nAda,Lovelace,"unterminated',
  });
  assert.equal(bad.status, 400, JSON.stringify(bad.body));
  assert.equal(Number((await db("contacts").count("* as n").first()).n), before);
});
```

## Explain it back

Give a five-minute walkthrough: the original problem, one invariant, the exact changed function, the most revealing failure test, and one remaining limitation. You should be able to explain why the implementation is correct for the worked example without reading the code aloud line by line.
