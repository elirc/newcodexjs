# Trace lab: A document query should not match an internal field

[Course index](README.md)

## Work the reduced example first

The following example isolates one idea. The linked project source remains the executable implementation; do not paste this teaching model over it.

```sql
-- Conceptual core of the actual parameterized model query:
SELECT id, title FROM notes
WHERE to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,''))
   @@ plainto_tsquery('english', 'run');
```

## Trace the real call path

### Boundary 1 — the search box decides when to ask

`client/src/App.jsx:41-43`: a `useEffect` on the search text waits 250 ms (`setTimeout(refresh, 250)`) and cancels the timer on the next keystroke, so the server sees one request per pause, not one per key. The stale-response race (exercise 3) lives here.

### Boundary 2 — the request leaves the browser

`GET /api/notes?search=<text>&status=&folder=` through the client's API service; the response envelope is unwrapped and the list is replaced wholesale.

### Boundary 3 — the service bounds the filters

`server/src/services/service.js:25` `list(query)`: each of `search`, `status`, `folder` must be a string of at most 255 characters (line 27), otherwise `ValidationError`; `sanitizePayload` (line 9) does the same for writes and rejects an empty edit with `At least one note field is required.`

### Boundary 4 — the model builds one query

`server/src/models/model.js:4` `listRecords`: `ORDER BY created_at DESC, id DESC` (the tie-break the third test pins), exact `status`/`folder` filters, and the full-text predicate over `title || ' ' || body` with `plainto_tsquery`, which strips operators so `%` and `*` are plain words, never wildcards.

### Boundary 5 — PostgreSQL evaluates the text search

`to_tsvector('english', ...)` stems words (`running` matches `run`) and ignores stop words; the optional GIN index from migration 002 makes it cheap. Ids and timestamps are not in the vector, which is what the first test proves by searching for a fragment of an id and getting nothing.

### Boundary 6 — the envelope returns rows the client renders

`sendSuccess` returns `{ success: true, data: [...] }`; the client replaces its list. Because ordering is stable, a re-run of the same search gives the same order, which is what makes the stale-response race detectable in a test.

## Follow the boundary with concrete values

Predict Running notes matching run through stemming. Predict a note whose folder alone contains HiddenKeyword not matching that content query. Filtering by folder is still available as a separate exact predicate. A percent sign is ordinary search input, not an instruction to match every row. The real model binds the term through a parameter; the literal above is only a readable SQL example. Next draw the client race: old request starts, new request starts, new completes, old completes. Debouncing alone does not determine which result wins. A request version rejects old state publication, including old error/loading updates. Test this with controlled delayed responses; do not rely on internet timing to reproduce it.

## Connect the model to real code

Open [server/src/models/model.js](../server/src/models/model.js) beside [server/test/search.test.cjs](../server/test/search.test.cjs). Identify the caller, the input representation, the decisive guard or transition, and the observable result. Write the value at each step of this actual fixture before executing it:

Running notes matches search run through stemming. A note whose folder is HiddenKeyword does not match that content query. Invalid tags are rejected before writing. Updating only body retains title/id and makes its new words searchable.

If the observation differs from your prediction, find the first changed representation or branch. Do not jump straight to altering the expected assertion. Explain whether the fixture, implementation or your mental model was wrong.

## Independent checkpoint

Change one boundary value and write a new expected-state table. Include an ordinary case and a failure or empty case. Describe which data should remain identical and which visible feedback should change. Finish with a five-minute walkthrough explaining the responsibility of each relevant file and one explicitly unsupported scenario.
