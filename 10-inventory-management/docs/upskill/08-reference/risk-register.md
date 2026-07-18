# Risk Register

Project: **Inventory Management System** (`10-inventory-management`)

| Risk | Evidence | File anchors | Impact | Likelihood | Suggested test | Suggested fix | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Missing tests | No direct tests confirmed | `server/src/routes/routes.ts:4`, `server/src/services/service.ts:5` | regressions | medium | API integration | add tests | medium |
| Authorization gap | Demo projects may not enforce ownership | `server/src/services/service.ts:5` | data exposure | medium | cross-user access test | add owner filters | medium |
| Unbounded list | List endpoints may lack pagination | `server/src/models/model.ts:1` | slow queries | medium | seed many rows | add limit/cursor | medium |
| Error opacity | minimal observability | `server/src/middleware/errorMiddleware.ts:2` | hard debugging | medium | failure scenario | structured logs | medium |
