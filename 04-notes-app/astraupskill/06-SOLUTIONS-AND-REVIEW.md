# Solutions and engineering review

[Course index](README.md) · [Practice prompts](05-PRACTICE.md)

Attempt each exercise before using these notes. These are solution approaches and review criteria, not claims that every extension has been implemented. The actual completed behavior is described in the worked-change chapter.

## Check a solution the same way the course checks its own

Every solution below should survive the same request chapter 03 runs; send it after your change and compare the response to the expected observations in chapter 03:

```javascript
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const helper = require("./database.cjs");
helper.configure();
const { db } = require("../src/config/db");
const app = require("../src/app");
const { up } = require("../db/migrations/001_init");

// The four blocks share one disposable schema and one HTTP server (set up once in
// before, torn down once in after) and use distinct fixture words, so each block
// can still be run alone with `node --test --test-name-pattern "..."`. An earlier
// version stood up a schema per block, which destroyed the shared Knex pool after
// the first block and hung the run.
let http, cleanup;
before(async () => {
  cleanup = await helper.prepare(db, up);
  http = await helper.listen(app);
});
after(async () => {
  if (http) await http.close();
  if (cleanup) await cleanup();
});
async function fixture() {
  const create = (title, body, folder = "General") =>
    http.request("POST", "/api/notes", {
      title,
      body,
      folder,
      status: "active",
      tags: ["search", "search"],
    });
  return { http, create };
}

test("search matches document content only, with stemming and no wildcards", async (t) => {
  const { http, create } = await fixture(t);

  const a = await create("Running notes", "Practice indexing and queries");
  assert.equal(a.status, 201);
  const b = await create("Other document", "Cooking vegetables", "HiddenKeyword");
  assert.equal(b.status, 201);
  const id = a.body.data.id;

  // Tags are de-duplicated on the way in.
  assert.deepEqual(a.body.data.tags, ["search"]);

  // to_tsvector('english', ...) stems both sides, so "run" finds "Running".
  // A LIKE '%run%' would match that too - the next two assertions are what
  // actually separate full-text search from a substring match.
  let result = await http.request("GET", "/api/notes?search=run");
  assert.deepEqual(
    result.body.data.map((x) => x.id),
    [id],
  );

  // The old query cast the WHOLE ROW to text, so a note whose *folder* was
  // HiddenKeyword matched a content search for it. It must not.
  result = await http.request("GET", "/api/notes?search=HiddenKeyword");
  assert.equal(result.body.data.length, 0);

  // A user-supplied % used to be a LIKE wildcard that returned everything.
  // plainto_tsquery treats it as punctuation, so it matches nothing.
  result = await http.request("GET", "/api/notes?search=%25");
  assert.equal(result.body.data.length, 0);
});

test("filters compose with search rather than replacing it", async (t) => {
  const { http, create } = await fixture(t);

  const a = await create("Kayaking notes", "Practice indexing and queries");
  assert.equal(a.status, 201);
  const b = await create("Kayaking errands", "Shopping list", "Errands");
  assert.equal(b.status, 201);

  // Both notes match the search; only one is in the General folder.
  assert.equal(
    (await http.request("GET", "/api/notes?search=kayak")).body.data.length,
    2,
  );
  const scoped = await http.request("GET", "/api/notes?search=kayak&folder=General");
  assert.deepEqual(
    scoped.body.data.map((x) => x.id),
    [a.body.data.id],
  );

  // A folder nobody used narrows to nothing: the predicates are ANDed, not ORed.
  assert.equal(
    (await http.request("GET", "/api/notes?search=kayak&folder=Missing")).body.data.length,
    0,
  );

  // A filter on its own still works without a search term.
  assert.deepEqual(
    (await http.request("GET", "/api/notes?folder=Errands")).body.data.map((x) => x.id),
    [b.body.data.id],
  );
});

test("ordering is deterministic: created_at DESC, then id DESC", async (t) => {
  const { http, create } = await fixture(t);

  // Insert three notes, then force identical created_at values - which is what
  // happens in practice when rows are written inside one transaction or in the
  // same clock tick. Without the `id` tie-break on models/model.js the order of
  // these three is whatever the plan happens to produce, and it can change with
  // the row count or the PostgreSQL version.
  const ids = [];
  for (const title of ["First", "Second", "Third"]) {
    const row = await create(title, "same instant");
    assert.equal(row.status, 201);
    ids.push(row.body.data.id);
  }
  await db("notes")
    .whereIn("id", ids)
    .update({ created_at: new Date("2026-01-01T00:00:00.000Z") });

  const expected = [...ids].sort((x, y) => y - x);
  const listed = await http.request("GET", "/api/notes?search=instant");
  assert.deepEqual(
    listed.body.data.map((x) => x.id),
    expected,
    "highest id first when created_at ties",
  );

  // The tie-break must survive a filtered query too, since it lives in the
  // shared builder in models/model.js rather than in one route.
  const searched = await http.request("GET", "/api/notes?search=instant");
  assert.deepEqual(
    searched.body.data.map((x) => x.id),
    expected,
  );

  // A note created later still sorts first, so the id tie-break has not
  // accidentally become the primary sort.
  const newer = await create("Fourth", "later");
  assert.equal(
    (await http.request("GET", "/api/notes")).body.data[0].id,
    newer.body.data.id,
  );
});

test("a PUT carrying one field leaves the others alone, and bad input is rejected before any write", async (t) => {
  const { http, create } = await fixture(t);

  const a = await create("Partial-update notes", "Practice indexing and queries");
  const id = a.body.data.id;

  // Four rejections, each a different guard in services/service.js.
  assert.equal(
    (await http.request("GET", "/api/notes?search[]=bad")).status,
    400,
    "a repeated query parameter arrives as an array, not a string",
  );
  assert.equal(
    (await http.request("POST", "/api/notes", { title: 42 })).status,
    400,
    "title must be text",
  );
  assert.equal(
    (await http.request("PUT", `/api/notes/${id}`, { tags: [{}] })).status,
    400,
    "every tag must be non-empty text",
  );
  assert.equal(
    (await http.request("GET", "/api/notes/2147483648")).status,
    400,
    "ids are bounded by the int4 ceiling",
  );

  // None of those touched the row.
  assert.equal((await db("notes").where({ id }).first()).title, "Partial-update notes");

  // A partial update really is partial: sanitizePayload(payload, true) skips
  // undefined keys, so the title survives a body-only PUT. The old code would
  // have blanked it.
  const changed = await http.request("PUT", `/api/notes/${id}`, {
    body: "A revised explanation",
  });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.data.title, "Partial-update notes");

  // Read it back from the database, not from the response.
  assert.equal(
    (await db("notes").where({ id }).first()).body,
    "A revised explanation",
  );

  // And the new text is searchable, which proves the write reached the column
  // the search predicate reads.
  assert.equal(
    (await http.request("GET", "/api/notes?search=revised")).body.data[0].id,
    id,
  );
});
```

## Existing implementation

English to_tsvector/plainto_tsquery search uses bound parameters over title/body. The UI debounces requests and ignores older responses. Payloads and filters are bounded, tags serialize correctly to JSON, and partial edits retain omitted fields.

The key model is: Notes have title, body, folder, status and JSON tags. Search indexes the meaning of title/body; folder/status are independent exact filters, and internal ids/timestamps do not participate.

The worked fixture should behave as follows: Running notes matches search run through stemming. A note whose folder is HiddenKeyword does not match that content query. Invalid tags are rejected before writing. Updating only body retains title/id and makes its new words searchable.

## Extension solutions

### Exercise 1

**Prompt:** Add a vector/index migration.

**Approach:** Generate or backfill the same configured vector, verify behavior equivalence and then measure a larger fixture.

**Review:** the migration must create the GIN index on the exact expression used in `listRecords` (byte-for-byte, including `coalesce` and the `' '` separator) or the planner will not use it; your evidence is the two `EXPLAIN` plans from chapter 4 pasted into the write-up, and the four tests still green.

### Exercise 2

**Prompt:** Rank by relevance with stable ties.

**Approach:** Reuse the tsquery for rank and filtering; break ties by a documented stable field.

**Review:** `ts_rank` must be computed from the same `tsquery` used for filtering, ordering must fall back to `created_at DESC, id DESC` for equal ranks, and the test must show a lower-ranked but newer note ordered *after* a higher-ranked older one.

### Exercise 3

**Prompt:** Test slow-old versus fast-new responses.

**Approach:** Delay the first stub response, return the second and prove the second remains visible after both finish.

**Review:** the test must delay the first search response and resolve the second first (mock the API in a client test), then release the first and assert the second's results are still displayed; explain which line in `App.jsx` (the cleared timer, or a request sequence guard you add) makes it pass.

### Exercise 4

**Prompt:** Design multilingual search.

**Approach:** Decide whether language belongs to each note or the workspace, migrate deliberately and test language-specific stemming.

**Review:** the design must state where `language` lives, how the expression index changes (`to_tsvector(language::regconfig, ...)` cannot use a per-row column in an index expression unless it is immutable; say how you handle that), and demonstrate stemming differences with a two-word fixture.

### Exercise 7 — ownership and authorization

Reference: `listRecords(query)` gains `builder.where("owner", query.owner)`; `findRecord(id, owner)` becomes `.where({ id, owner }).first()`; the service passes `req.actor` through. Keep the search predicate unchanged so the index still applies.

Review: the owner belongs in every `WHERE`, including search, so a full-text hit on someone else's note never leaks; explain why 404 (not 403) is the right answer for a foreign id.

## Review questions with answer guidance

**Why not trust input just because it came from this UI?** A caller can bypass the UI, a saved file can be edited, and older data can have a different shape. Validate at the boundary that owns the operation.

**Why keep the id stable?** It identifies the same domain record across views and edits. Changing it can create duplicates, disconnect child records or make reconciliation impossible.

**What makes the failure test meaningful?** It observes the promised state invariant. For this project, explain exactly why the failing scenario in [server/test/search.test.cjs](../server/test/search.test.cjs) would detect the original or a plausible regression.

**What does the test not prove?** A bounded suite does not prove all concurrency, browsers, deployment configurations or unrelated domain behavior. Name the real limitation from this lesson instead of adding a generic disclaimer.

**When should you extract a helper?** When it isolates a coherent responsibility, makes an invariant clearer or enables a meaningful test without duplicating application logic. A pure validator and a shared persistence boundary are common examples, but do not abstract solely to increase the number of files.

## A sample change explanation

“The previous behavior was: The API cast a whole row to text, and the UI searched serialized JSON locally. Internal metadata could match a document query. Payload field types were not enforced. I changed the implementation so that: English to_tsvector/plainto_tsquery search uses bound parameters over title/body. The UI debounces requests and ignores older responses. Payloads and filters are bounded, tags serialize correctly to JSON, and partial edits retain omitted fields. The strongest evidence is the regression that exercises the worked fixture and checks authoritative state. A remaining design question is the final stretch exercise.”

Replace that explanation with your own words and actual test results. A strong junior engineer can connect a concrete user problem to code, verification and a clearly stated limit. Completing that explanation independently is the final checkpoint for this course.
