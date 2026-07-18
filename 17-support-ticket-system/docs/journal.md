# Engineering Journal

This journal explains the production-minded choices added to **Customer Support Ticket System** and is written for a junior engineer learning how larger full-stack apps are shaped.

## What Changed

- Added pagination, filtering, sorting, and archived-record handling to list endpoints.
- Added request context through demo headers so every write can name an actor and request id.
- Added comments, saved views, audit log, soft delete, archive/restore, bulk status updates, and readiness checks.
- Added more detailed dashboard aggregates: active totals, archived totals, status buckets, priority buckets, recent activity.
- Preserved the existing React + Express + Knex + PostgreSQL stack and the controller/service/model boundary.

## Why These Choices Matter

### Soft Delete Instead Of Hard Delete

Enterprise apps usually need reversibility, auditability, and investigation paths. A hard delete removes evidence. Soft delete keeps the row out of normal queries while preserving the ability to inspect what happened.

Tradeoff: every query now must remember to filter `deleted_at`. The model layer owns that default so controllers and UI do not have to remember it.

### Archive/Restore As A Separate Lifecycle

Archive is not the same as delete. Archived records are complete or inactive, but still useful for reports. Deleted records are hidden from normal operations.

Tradeoff: the UI needs an `includeArchived` filter and the API needs a clear lifecycle contract.

### Audit Log

The audit log records actor, action, before/after shape, and request id. This teaches a core production habit: if a customer or manager asks "who changed this?", the system should have an answer.

Tradeoff: audit data can grow quickly. A real production version would add retention rules, indexes, and maybe partitioning.

### Request Context

The request context middleware gives every request a request id, actor, and role. In production this would come from authentication. Here it is intentionally demo-header based so learners can inspect the pattern without building a full identity provider.

Tradeoff: demo headers are not security. The journal calls this out because a junior engineer should not mistake a teaching seam for production auth.

### Comments And Saved Views

Comments make collaboration explicit. Saved views model the dashboards that enterprise users naturally create for repeated workflows.

Tradeoff: these features introduce ownership questions. In production, saved views need visibility rules: private, team, organization, or global.

### Bulk Operations

Bulk status updates are common in operational tools. They teach validation, blast radius, and transaction boundaries.

Tradeoff: bulk actions can accidentally affect many records. The UI shows selected count, and the service validates ids/status before writing.

## Boundary Decisions

| Boundary | Decision | Why |
| --- | --- | --- |
| UI | Own filters, selected rows, comments panel | These are interaction concerns. |
| Client API | Own URLs, demo headers, envelope unwrapping | Keeps transport details out of components. |
| Controller | Only parse request and return envelope | Keeps HTTP layer thin. |
| Service | Validate ids, roles, statuses, priorities | Protects every caller, not just the UI. |
| Model | Own query defaults, transactions, audit writes | Keeps persistence consistency close to SQL. |
| Migration | Add lifecycle/audit/collaboration tables | Schema is the durable contract. |

## What A Junior Should Notice

1. Bigger apps are not just "more CRUD." They add lifecycle, auditability, collaboration, and operational visibility.
2. Almost every enterprise feature creates a new invariant.
3. Production readiness is often about boring guarantees: who changed it, can we undo it, can we filter it, can we trace it, can we recover it?
4. Boundaries reduce the number of places a future engineer must inspect.

## What A Mid-Level Engineer Should Practice

- Add tests for archive/restore and soft delete list behavior.
- Add a real authorization check for team-scoped access.
- Add indexes that match the most common filters.
- Add optimistic UI behavior for bulk status updates with rollback on failure.
- Add migration notes for existing data.

## What A Senior Engineer Would Challenge

- Is the audit log schema enough for compliance, or does it need immutability guarantees?
- Should audit writes be in-band transactions, an outbox, or an event stream?
- What is the retention policy for comments, activity, and audit rows?
- How do we prevent bulk operations from becoming accidental incidents?
- What is the rollout plan if existing records do not have lifecycle columns?

## Suggested Learning Drill

Trace a bulk status update:

1. UI selected ids.
2. Client API request.
3. Route and controller.
4. Service validation.
5. Transactional model update.
6. Activity and audit writes.
7. Dashboard refresh.

Self-grade:

- Basic: names the files.
- Solid: explains the data shape at every step.
- Strong: identifies the transaction boundary, rollback behavior, authorization risk, and the test you would add.
