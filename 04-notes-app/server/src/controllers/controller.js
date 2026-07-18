const service = require("../services/service");
const { sendSuccess } = require("../utils/response");
/** Handles list requests. */
async function list(req, res) { return sendSuccess(res, await service.list(req.query)); }
/** Handles detail requests. */
async function get(req, res) { return sendSuccess(res, await service.get(req.params.id)); }
/** Handles create requests. */
async function create(req, res) { return sendSuccess(res, await service.create(req.body), 201); }
/** Handles update requests. */
async function update(req, res) { return sendSuccess(res, await service.update(req.params.id, req.body)); }
/** Handles delete requests. */
async function remove(req, res) { return sendSuccess(res, await service.remove(req.params.id)); }
/** Handles stats requests. */
async function stats(req, res) { return sendSuccess(res, await service.getStats()); }
module.exports = { list, get, create, update, remove, stats };
