const service = require("../services/expenseService");
const { sendSuccess } = require("../utils/responses");

/** Lists budgets for a month. */
async function list(req, res) { return sendSuccess(res, await service.listBudgets(req.query.month)); }
/** Sets or updates a budget. */
async function upsert(req, res) { return sendSuccess(res, await service.upsertBudget(req.body), 201); }
/** Deletes a budget. */
async function remove(req, res) { return sendSuccess(res, await service.deleteBudget(Number(req.params.id))); }

module.exports = { list, upsert, remove };
