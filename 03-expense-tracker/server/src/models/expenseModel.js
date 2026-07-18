const db = require("../config/db");

/**
 * Builds the base expense query with joins and filters.
 * @param {object} filters Query filters.
 * @returns {import("knex").Knex.QueryBuilder}
 */
function expenseQuery(filters = {}) {
  const query = db("expenses")
    .join("categories", "categories.id", "expenses.category_id")
    .select("expenses.*", "categories.name as category_name", "categories.color as category_color", "categories.icon as category_icon");
  if (filters.start_date) query.where("expense_date", ">=", filters.start_date);
  if (filters.end_date) query.where("expense_date", "<=", filters.end_date);
  if (filters.category_id) query.where("category_id", filters.category_id);
  return query;
}

/**
 * Lists expenses with optional filters and sorting.
 * @param {object} filters Query filters.
 * @returns {Promise<Array<object>>}
 */
async function listExpenses(filters) {
  const sort = ["expense_date", "amount", "created_at"].includes(filters.sort) ? filters.sort : "expense_date";
  const order = filters.order === "asc" ? "asc" : "desc";
  return expenseQuery(filters).orderBy(sort, order);
}

/**
 * Finds one expense by id.
 * @param {number} id Expense id.
 * @returns {Promise<object|undefined>}
 */
async function findExpense(id) {
  return expenseQuery().where("expenses.id", id).first();
}

/**
 * Inserts an expense.
 * @param {object} payload Expense fields.
 * @returns {Promise<object>}
 */
async function createExpense(payload) {
  const [created] = await db("expenses").insert(payload).returning("*");
  return findExpense(created.id);
}

/**
 * Updates an expense.
 * @param {number} id Expense id.
 * @param {object} payload Expense fields.
 * @returns {Promise<object|undefined>}
 */
async function updateExpense(id, payload) {
  const [updated] = await db("expenses").where({ id }).update({ ...payload, updated_at: db.fn.now() }).returning("*");
  return updated ? findExpense(id) : undefined;
}

/**
 * Deletes an expense.
 * @param {number} id Expense id.
 * @returns {Promise<number>}
 */
async function deleteExpense(id) {
  return db("expenses").where({ id }).del();
}

/**
 * Lists all categories.
 * @returns {Promise<Array<object>>}
 */
async function listCategories() {
  return db("categories").select("*").orderBy("name", "asc");
}

/**
 * Creates a category.
 * @param {object} payload Category fields.
 * @returns {Promise<object>}
 */
async function createCategory(payload) {
  const [created] = await db("categories").insert(payload).returning("*");
  return created;
}

/**
 * Updates a category.
 * @param {number} id Category id.
 * @param {object} payload Category fields.
 * @returns {Promise<object|undefined>}
 */
async function updateCategory(id, payload) {
  const [updated] = await db("categories").where({ id }).update(payload).returning("*");
  return updated;
}

/**
 * Deletes a custom category.
 * @param {number} id Category id.
 * @returns {Promise<number>}
 */
async function deleteCategory(id) {
  return db("categories").where({ id, is_default: false }).del();
}

/**
 * Lists budgets for a month with spending totals.
 * @param {string} month Month date.
 * @returns {Promise<Array<object>>}
 */
async function listBudgets(month) {
  return db("budgets")
    .join("categories", "categories.id", "budgets.category_id")
    .leftJoin("expenses", function joinExpenses() {
      this.on("expenses.category_id", "budgets.category_id")
        .andOn("expenses.expense_date", ">=", db.raw("budgets.month"))
        .andOn("expenses.expense_date", "<", db.raw("budgets.month + interval '1 month'"));
    })
    .where("budgets.month", month)
    .groupBy("budgets.id", "categories.id")
    .select("budgets.*", "categories.name as category_name", "categories.color", db.raw("COALESCE(SUM(expenses.amount), 0)::float as spent"));
}

/**
 * Upserts a monthly budget.
 * @param {object} payload Budget fields.
 * @returns {Promise<object>}
 */
async function upsertBudget(payload) {
  const [budget] = await db("budgets")
    .insert(payload)
    .onConflict(["category_id", "month"])
    .merge({ amount: payload.amount, updated_at: db.fn.now() })
    .returning("*");
  return budget;
}

/**
 * Deletes a budget.
 * @param {number} id Budget id.
 * @returns {Promise<number>}
 */
async function deleteBudget(id) {
  return db("budgets").where({ id }).del();
}

/**
 * Summarizes one month.
 * @param {string} month YYYY-MM.
 * @returns {Promise<object>}
 */
async function monthlySummary(month) {
  const start = `${month}-01`;
  const [summary] = await db("expenses")
    .where("expense_date", ">=", start)
    .where("expense_date", "<", db.raw("?::date + interval '1 month'", [start]))
    .select(db.raw("COALESCE(SUM(amount), 0)::float as total_spent"), db.raw("COUNT(*)::int as expense_count"), db.raw("COALESCE(AVG(amount), 0)::float as average_expense"));
  return summary;
}

/**
 * Groups spending by category for a date range.
 * @param {object} filters Date filters.
 * @returns {Promise<Array<object>>}
 */
async function byCategory(filters) {
  return expenseQuery(filters)
    .groupBy("categories.id")
    .select("categories.name", "categories.color", db.raw("SUM(expenses.amount)::float as total"), db.raw("COUNT(*)::int as count"))
    .orderBy("total", "desc");
}

/**
 * Groups spending by day in a month.
 * @param {string} month YYYY-MM.
 * @returns {Promise<Array<object>>}
 */
async function dailyTrend(month) {
  const start = `${month}-01`;
  return db("expenses")
    .where("expense_date", ">=", start)
    .where("expense_date", "<", db.raw("?::date + interval '1 month'", [start]))
    .groupByRaw("DATE_TRUNC('day', expense_date)")
    .select(db.raw("DATE_TRUNC('day', expense_date)::date as date"), db.raw("SUM(amount)::float as total"))
    .orderBy("date", "asc");
}

/**
 * Groups spending by day for one selected week.
 * @param {string} weekStart Week start date.
 * @returns {Promise<Array<object>>}
 */
async function weeklyTrend(weekStart) {
  return db("expenses")
    .where("expense_date", ">=", weekStart)
    .where("expense_date", "<", db.raw("?::date + interval '7 days'", [weekStart]))
    .groupByRaw("DATE_TRUNC('day', expense_date)")
    .select(db.raw("DATE_TRUNC('day', expense_date)::date as date"), db.raw("SUM(amount)::float as total"))
    .orderBy("date", "asc");
}

module.exports = {
  listExpenses,
  findExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listBudgets,
  upsertBudget,
  deleteBudget,
  monthlySummary,
  byCategory,
  dailyTrend,
  weeklyTrend
};
