const service = require("../services/expenseService");
const { sendSuccess } = require("../utils/responses");

/** Returns monthly summary totals. */
async function monthly(req, res) { return sendSuccess(res, await service.monthlySummary(req.query.month || new Date().toISOString().slice(0, 7))); }
/** Returns category breakdown. */
async function byCategory(req, res) { return sendSuccess(res, await service.byCategory(req.query)); }
/** Returns daily trend for a month. */
async function daily(req, res) { return sendSuccess(res, await service.dailyTrend(req.query.month || new Date().toISOString().slice(0, 7))); }
/** Returns weekly trend. */
async function weekly(req, res) { return sendSuccess(res, await service.weeklyTrend(req.query.week_start || new Date().toISOString().slice(0, 10))); }

module.exports = { monthly, byCategory, daily, weekly };
