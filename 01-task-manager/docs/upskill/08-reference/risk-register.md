# Risk Register

Project: **Personal Task Manager** (`01-task-manager`)

| Risk | Evidence | File anchors | Impact | Likelihood | Suggested test | Suggested fix | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Missing tests | No direct tests confirmed | `server/src/routes/taskRoutes.js:5`, `server/src/services/taskService.js:17` | regressions | medium | API integration | add tests | medium |
| Authorization gap | Demo projects may not enforce ownership | `server/src/services/taskService.js:17` | data exposure | medium | cross-user access test | add owner filters | medium |
| Unbounded list | List endpoints may lack pagination | `server/src/models/taskModel.js:1` | slow queries | medium | seed many rows | add limit/cursor | medium |
| Error opacity | minimal observability | `server/src/middleware/errorMiddleware.js:1` | hard debugging | medium | failure scenario | structured logs | medium |
