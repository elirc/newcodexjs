const service = require("../services/expenseService");
const { sendSuccess } = require("../utils/responses");

/** Lists categories. */
async function list(_req, res) { return sendSuccess(res, await service.listCategories()); }
/** Creates a category. */
async function create(req, res) { return sendSuccess(res, await service.createCategory(req.body), 201); }
/** Updates a category. */
async function update(req, res) { return sendSuccess(res, await service.updateCategory(Number(req.params.id), req.body)); }
/** Deletes a custom category. */
async function remove(req, res) { return sendSuccess(res, await service.deleteCategory(Number(req.params.id))); }

module.exports = { list, create, update, remove };
