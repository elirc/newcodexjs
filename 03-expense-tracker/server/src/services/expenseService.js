const model = require("../models/expenseModel");
const { expensesToCsv } = require("../utils/csv");
const { NotFoundError, ValidationError } = require("../middleware/errors");

const paymentMethods = ["cash", "credit_card", "debit_card", "bank_transfer", "other"];

/**
 * Validates and normalizes expense payloads.
 * @param {object} payload Raw payload.
 * @returns {object}
 */
function parseExpense(payload) {
  const amount = Number(payload.amount);
  if (!Number.isFinite(amount)) throw new ValidationError("Amount must be a finite number");
  if (amount <= 0) throw new ValidationError("Amount must be greater than zero");
  if (Math.abs(amount * 100 - Math.round(amount * 100)) > 0.00001) throw new ValidationError("Amount may have at most two decimal places");
  if (amount > 99999999.99) throw new ValidationError("Amount must not exceed 99,999,999.99");
  if (!payload.description?.trim()) throw new ValidationError("Description is required");
  if (!payload.category_id) throw new ValidationError("Category is required");
  validDate(payload.expense_date);
  const recurringInterval = payload.is_recurring ? payload.recurring_interval : null;
  if (recurringInterval && !["weekly", "monthly"].includes(recurringInterval)) throw new ValidationError("Recurring interval must be weekly or monthly");
  return {
    amount,
    description: payload.description.trim(),
    category_id: Number(payload.category_id),
    expense_date: payload.expense_date,
    payment_method: paymentMethods.includes(payload.payment_method) ? payload.payment_method : "cash",
    is_recurring: Boolean(payload.is_recurring),
    recurring_interval: recurringInterval,
    notes: payload.notes?.trim() || null
  };
}

/**
 * Lists expenses.
 * @param {object} query Query filters.
 * @returns {Promise<Array<object>>}
 */
async function listExpenses(query) {
  return model.listExpenses(validFilters(query));
}

/**
 * Gets one expense.
 * @param {number} id Expense id.
 * @returns {Promise<object>}
 */
async function getExpense(id) {
  const expense = await model.findExpense(id);
  if (!expense) throw new NotFoundError("Expense not found");
  return expense;
}

/**
 * Creates an expense.
 * @param {object} payload Raw payload.
 * @returns {Promise<object>}
 */
async function createExpense(payload) {
  return model.createExpense(parseExpense(payload));
}

/**
 * Updates an expense.
 * @param {number} id Expense id.
 * @param {object} payload Raw payload.
 * @returns {Promise<object>}
 */
async function updateExpense(id, payload) {
  const expense = await model.updateExpense(id, parseExpense(payload));
  if (!expense) throw new NotFoundError("Expense not found");
  return expense;
}

/**
 * Deletes an expense.
 * @param {number} id Expense id.
 * @returns {Promise<object>}
 */
async function deleteExpense(id) {
  const deleted = await model.deleteExpense(id);
  if (!deleted) throw new NotFoundError("Expense not found");
  return { id };
}

/**
 * Exports filtered expenses as CSV.
 * @param {object} query Query filters.
 * @returns {Promise<string>}
 */
async function exportExpenses(query) {
  return expensesToCsv(await model.listExpenses(validFilters(query)));
}

/**
 * Lists categories.
 * @returns {Promise<Array<object>>}
 */
async function listCategories() {
  return model.listCategories();
}

/**
 * Creates a category.
 * @param {object} payload Raw payload.
 * @returns {Promise<object>}
 */
async function createCategory(payload) {
  if (!payload.name?.trim()) throw new ValidationError("Category name is required");
  return model.createCategory({ name: payload.name.trim(), icon: payload.icon || "tag", color: payload.color || "#2563eb", is_default: false });
}

/**
 * Updates a category.
 * @param {number} id Category id.
 * @param {object} payload Raw payload.
 * @returns {Promise<object>}
 */
async function updateCategory(id, payload) {
  const category = await model.updateCategory(id, { name: payload.name, icon: payload.icon, color: payload.color });
  if (!category) throw new NotFoundError("Category not found");
  return category;
}

/**
 * Deletes a custom category.
 * @param {number} id Category id.
 * @returns {Promise<object>}
 */
async function deleteCategory(id) {
  const deleted = await model.deleteCategory(id);
  if (!deleted) throw new ValidationError("Only custom categories with no expenses can be deleted");
  return { id };
}

/**
 * Lists budgets with status labels.
 * @param {string} month Month date.
 * @returns {Promise<Array<object>>}
 */
async function listBudgets(month) {
  const rows = await model.listBudgets(`${month || new Date().toISOString().slice(0, 7)}-01`);
  return rows.map((row) => ({
    ...row,
    percent_used: row.amount > 0 ? Math.round((row.spent / Number(row.amount)) * 100) : 0,
    status: row.spent > Number(row.amount) ? "exceeded" : row.spent > Number(row.amount) * 0.8 ? "warning" : "ok"
  }));
}

/**
 * Creates or updates a monthly budget.
 * @param {object} payload Raw payload.
 * @returns {Promise<object>}
 */
async function upsertBudget(payload) {
  const amount = Number(payload.amount);
  if (!payload.category_id || !amount || amount <= 0 || !payload.month) throw new ValidationError("category_id, month, and positive amount are required");
  return model.upsertBudget({ category_id: Number(payload.category_id), month: `${payload.month.slice(0, 7)}-01`, amount });
}

/**
 * Deletes a budget.
 * @param {number} id Budget id.
 * @returns {Promise<object>}
 */
async function deleteBudget(id) {
  const deleted = await model.deleteBudget(id);
  if (!deleted) throw new NotFoundError("Budget not found");
  return { id };
}

function validDate(value) {
  if (typeof value !== 'string' || value.startsWith('0000-') || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ValidationError('Use a YYYY-MM-DD date');
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) throw new ValidationError('Use a real calendar date');
  return value;
}
function validMonth(value) {
  if (typeof value !== 'string' || value.startsWith('0000-') || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) throw new ValidationError('Use a YYYY-MM month');
  return value;
}
function validFilters(query = {}) {
  if (query.start_date) validDate(query.start_date);
  if (query.end_date) validDate(query.end_date);
  if (query.start_date && query.end_date && query.start_date > query.end_date) throw new ValidationError('start_date must not follow end_date');
  if (query.category_id && (!Number.isSafeInteger(Number(query.category_id)) || Number(query.category_id) < 1)) throw new ValidationError('category_id must be a positive integer');
  return query;
}

module.exports = {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  exportExpenses,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listBudgets,
  upsertBudget,
  deleteBudget,
  monthlySummary: (month) => model.monthlySummary(validMonth(month)),
  byCategory: (filters) => model.byCategory(validFilters(filters)),
  dailyTrend: (month) => model.dailyTrend(validMonth(month)),
  weeklyTrend: (start) => model.weeklyTrend(validDate(start))
};
