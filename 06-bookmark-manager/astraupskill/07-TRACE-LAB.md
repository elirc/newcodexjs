# Trace lab: A valid bookmark URL is not automatic fetch permission

[Course index](README.md)

## Work the reduced example first

The following example isolates one idea. The linked project source remains the executable implementation; do not paste this teaching model over it.

```javascript
// Reduced policy examples; these strings are not fetched by this lesson.
const cases = [
  'https://allowed.example/page', // still needs configured host + public DNS
  'https://127.0.0.1/private',    // metadata rejects IP literals
  'http://allowed.example/page', // metadata requires HTTPS
  'javascript:alert(1)',        // bookmark validation rejects this scheme
];
```

## Trace the real call path

### Boundary 1 — the bookmark form decides what to send

`client/src/App.tsx` (the whole UI lives in this one file; there is no `pages` folder): `saveRecord` posts the whole form `{ title, url, collection, status, tags }` on create and also sends the whole form on save (`updateRecord(editingId, form)`), not only the edited keys. Metadata fetch ("Use page title") is a separate, optional action; the button is disabled only while a fetch is in flight (`metadataBusy`). Disabling it when the server reports no allowed hosts is exercise 1.

### Boundary 2 — the request leaves the browser

`client/src/services/api.ts`: `POST /api/bookmarks`, `PUT /api/bookmarks/:id`, `POST /api/bookmarks/metadata`. `listRecords()` is called with no filters; the search box filters the loaded list in the browser (`filteredRecords`), so `GET /api/bookmarks?search=...` is server-side only. `unwrap` reads the envelope only on 2xx. On a 400, axios rejects first with its own message ("Request failed with status code 400"), and that message, not the Zod text, is what `setError` shows. Surfacing the server's message would need an `error.response.data.error.message` read (compare the interceptor in Projects 7-10).

### Boundary 3 — the service validates with Zod

`server/src/services/service.ts`: `parseId` (line 18) bounds ids; the create/update schema is run with `safeParse` and every issue joined into one message (line 23); an empty edit is rejected (line 24); `list` (line 27) bounds `search` and `status` to 255 characters. The URL schema rejects `javascript:` and credentials in the authority.

### Boundary 4 — the model builds one query

`server/src/models/model.ts` `listRecords`: exact `status`, then a bounded `ILIKE` per text column with escaped metacharacters (the fix-pass change); `updateRecord` is one `UPDATE ... RETURNING *` with `tags` serialized only when present, so a partial `PUT` leaves them alone.

### Boundary 5 — PostgreSQL commits the row

`bookmarks` has `tags jsonb`; each write is one statement. The first test sends four malformed edits and reads the row back to prove none changed it; the new search test proves ids and timestamps are not searchable.

### Boundary 6 — the envelope tells the client what happened

`sendSuccess` / `errorMiddleware`: 201/200 with the row, 400 with the joined Zod message, 404 for a missing id. Metadata denial (host not allowed) is a 4xx that leaves the stored record intact.

## Follow the boundary with concrete values

Follow every boundary before a request: URL shape and credentials, exact configured hostname, port, resolved address set, then a pinned connection lookup. An allowed hostname that resolves partly to private addresses is rejected before transfer. If DNS finishes after the deadline, the abort check prevents a late connection. A redirect response is rejected without following Location, so a redirect toward a private target is never contacted. The transfer also limits headers, bytes, encoding and total time. The controlled test maps only the connection factory to a local HTTP server, preserving production response handling. Finally distinguish preview from save: preview returns text, and the form applies it only if the URL still matches. Creating a bookmark itself never makes the outbound request.

## Connect the model to real code

Open [server/src/services/metadata.ts](../server/src/services/metadata.ts) beside [server/test/metadata.test.ts](../server/test/metadata.test.ts). Identify the caller, the input representation, the decisive guard or transition, and the observable result. Write the value at each step of this actual fixture before executing it:

A controlled host returns title A &amp; B, yielding A & B. A redirect to loopback is rejected without contacting its target. Private DNS, unlisted hosts, oversized bodies and timeouts fail. DNS finishing after timeout cannot start a transfer. A javascript: URL is rejected before insertion.

If the observation differs from your prediction, find the first changed representation or branch. Do not jump straight to altering the expected assertion. Explain whether the fixture, implementation or your mental model was wrong.

## Independent checkpoint

Change one boundary value and write a new expected-state table. Include an ordinary case and a failure or empty case. Describe which data should remain identical and which visible feedback should change. Finish with a five-minute walkthrough explaining the responsibility of each relevant file and one explicitly unsupported scenario.
