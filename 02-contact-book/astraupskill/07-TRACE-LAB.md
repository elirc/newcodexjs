# Trace lab: commas, quotes and transaction rollback

[Course index](README.md)

## Parse context, not characters alone

```csv
name,email,company,notes
Maya,maya@example.com,"Labs, Inc.","She said ""hello"""
```

The company decodes to Labs, Inc. and notes to She said "hello". Splitting on every comma would break the company. A newline inside a quoted field belongs to that value rather than ending its record.

Mark whether the parser is inside quotes. Outside, a comma ends a field and a newline ends a row. Inside, those characters are content. A doubled quote appends one quote; a closing quote returns to the outside state. This changing interpretation is why the parser uses a state machine.

Trace the parser linked in chapter 3 character by character, then remove the closing quote. Rejection is preferable to guessing later row boundaries.

## Trace the real call path

### Boundary 1 — the import screen decides what to send

`client/src/features/contacts`: the import dialog reads the chosen file as text and posts `{ csv }` through `client/src/services`; the export button downloads the CSV built by `contactsToCsv`. The browser never parses the CSV: parsing is the server's job so the same rules apply to every client.

### Boundary 2 — the request leaves the browser

`POST /api/contacts/import` with a JSON body `{ csv: "..." }` (the controller also accepts a raw body). The client shows `error.message` from the envelope on failure, which is the CSV parser's message with the offending row.

### Boundary 3 — the route and controller hand the text to the service

`server/src/routes/contactRoutes.js:12` -> `contactController.importCsv` (line 49) -> `contactService.importContacts(req.body.csv || req.body)`. No validation happens here; the controller's only job is the envelope.

### Boundary 4 — the service parses everything before touching the database

`contactService.importContacts` (line 124): `csvToContacts` (`server/src/utils/csv.js`) turns the text into rows, handling quoted commas, doubled quotes, multiline notes and CRLF; every row is validated *before* a transaction is opened, so an invalid row 20 saves no rows (second test). Then it calls `importContactBatch`.

### Boundary 5 — the model writes all rows in one transaction

`contactModel.importContactBatch` (line 160): `db.transaction` -> per contact `INSERT ... RETURNING *`, per tag `INSERT ... ON CONFLICT (name) DO NOTHING`, `SELECT`, junction `INSERT`. A unique violation on a late row (third test) rolls back the contacts, new tags and junctions inserted earlier in the same call.

### Boundary 6 — the envelope tells the client what happened

`sendSuccess` answers `{ success: true, data: { imported, contacts } }`; a `ValidationError` from the parser becomes 400 with the row and column in the message. The new HTTP test reads both statuses and counts `contacts` directly to prove the 400 saved nothing.

## Separate structure and domain rules

Valid quoting does not guarantee supported unique headers, consistent row widths or acceptable contact fields. Tag names use the documented pipe separator. Make four invalid fixtures: malformed quoting, repeated header, missing required field and excessive record count. Locate the layer that rejects each before insertion.

## Fail late to prove rollback

Let row one create a new contact and TemporaryTag, then let row two violate a duplicate-email database constraint. After failure, neither the new contact, tag nor contact-tag link may remain.

An early invalid-field test cannot prove transaction rollback because no writes have started. Both tests matter, but they establish different guarantees.

Every contact, tag and junction operation must use the same transaction object. An accidental ordinary connection can write outside rollback. Catching an error inside the transaction and silently continuing can also undermine the contract.

Run [import.test.cjs](../server/test/import.test.cjs). Explain the counts before the batch, the writes attempted before failure, and the counts after rollback. A failed response alone does not prove atomicity.
