# Risk Register

Project: **Personal Expense Tracker** (`03-expense-tracker`)

| Risk | Evidence | File anchors | Impact | Likelihood | Suggested test | Suggested fix | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Missing tests | No direct tests confirmed | `server/src/routes/expenseRoutes.js:5`, `server/src/services/expenseService.js:12` | regressions | medium | API integration | add tests | medium |
| Authorization gap | Demo projects may not enforce ownership | `server/src/services/expenseService.js:12` | data exposure | medium | cross-user access test | add owner filters | medium |
| Unbounded list | List endpoints may lack pagination | `server/src/models/expenseModel.js:1` | slow queries | medium | seed many rows | add limit/cursor | medium |
| Error opacity | minimal observability | `server/src/middleware/errors.js:3` | hard debugging | medium | failure scenario | structured logs | medium |
