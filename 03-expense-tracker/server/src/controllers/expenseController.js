const service = require("../services/expenseService");
const { sendSuccess } = require("../utils/responses");

/** Lists expenses. */
async function list(req, res) { return sendSuccess(res, await service.listExpenses(req.query)); }
/** Gets one expense. */
async function get(req, res) { return sendSuccess(res, await service.getExpense(Number(req.params.id))); }
/** Creates an expense. */
async function create(req, res) { return sendSuccess(res, await service.createExpense(req.body), 201); }
/** Updates an expense. */
async function update(req, res) { return sendSuccess(res, await service.updateExpense(Number(req.params.id), req.body)); }
/** Deletes an expense. */
async function remove(req, res) { return sendSuccess(res, await service.deleteExpense(Number(req.params.id))); }
/** Exports filtered CSV. */
async function exportCsv(req, res) {
  const csv = await service.exportExpenses(req.query);
  res.header("Content-Type", "text/csv");
  res.attachment("expenses.csv");
  return res.send(csv);
}

module.exports = { list, get, create, update, remove, exportCsv };
