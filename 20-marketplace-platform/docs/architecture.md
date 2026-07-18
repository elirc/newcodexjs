# Multi-Vendor Marketplace Architecture

## System Shape

```text
React enterprise workspace
  -> typed API client
  -> Express middleware: security, request context, JSON, logging
  -> routes/controllers
  -> service validation and role checks
  -> Knex models with transactions
  -> PostgreSQL lifecycle, comments, saved views, audit, activity
```

## Production-Oriented Additions

- `/ready` checks database connectivity separately from `/health`.
- Request context assigns request id, actor, and role.
- List endpoints support pagination and filtering.
- Delete is soft delete; archive/restore is a separate lifecycle.
- Comments, saved views, audit log, and activity events model collaboration and traceability.
- Writes that touch domain rows plus audit/activity use transactions.

## Main Boundaries

| Layer | Owns |
| --- | --- |
| UI | filters, selected rows, comments panel, saved-view action |
| Client API | request headers, route URLs, envelope unwrap |
| Controller | request/response translation |
| Service | validation, role checks, lifecycle rules |
| Model | SQL, transactions, audit/activity writes |
| Migration | durable lifecycle/collaboration/audit schema |

## Scale Risks To Discuss

- Audit and activity tables need retention/index strategy.
- Saved views need visibility and ownership rules.
- Bulk operations need rate limiting and confirmation UX.
- Demo request headers must become real authentication before production.
- List endpoint defaults should be monitored for latency.

See `docs/journal.md` for the teaching narrative behind these choices.
