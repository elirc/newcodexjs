# Risk Register

Project: **Notes App** (`04-notes-app`)

| Risk | Evidence | File anchors | Impact | Likelihood | Suggested test | Suggested fix | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Missing tests | No direct tests confirmed | `server/src/routes/routes.js:3`, `server/src/services/service.js:3` | regressions | medium | API integration | add tests | medium |
| Authorization gap | Demo projects may not enforce ownership | `server/src/services/service.js:3` | data exposure | medium | cross-user access test | add owner filters | medium |
| Unbounded list | List endpoints may lack pagination | `server/src/models/model.js:1` | slow queries | medium | seed many rows | add limit/cursor | medium |
| Error opacity | minimal observability | `server/src/middleware/errorMiddleware.js:1` | hard debugging | medium | failure scenario | structured logs | medium |
