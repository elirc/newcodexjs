# Risk Register

Project: **Recipe Manager** (`05-recipe-manager`)

| Risk | Evidence | File anchors | Impact | Likelihood | Suggested test | Suggested fix | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Missing tests | No direct tests confirmed | `server/src/routes/recipeRoutes.ts:1`, `server/src/services/recipeService.ts:17` | regressions | medium | API integration | add tests | medium |
| Authorization gap | Demo projects may not enforce ownership | `server/src/services/recipeService.ts:17` | data exposure | medium | cross-user access test | add owner filters | medium |
| Unbounded list | List endpoints may lack pagination | `server/src/models/recipeModel.ts:2` | slow queries | medium | seed many rows | add limit/cursor | medium |
| Error opacity | minimal observability | `server/src/middleware/errorHandler.ts:2` | hard debugging | medium | failure scenario | structured logs | medium |
