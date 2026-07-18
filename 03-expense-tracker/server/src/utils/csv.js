/**
 * Escapes a value for CSV output.
 * @param {unknown} value Raw value.
 * @returns {string} CSV-safe value.
 */
function escapeCsv(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Converts expense rows into CSV.
 * @param {Array<object>} expenses Expense rows.
 * @returns {string} CSV text.
 */
function expensesToCsv(expenses) {
  const headers = ["expense_date", "description", "category", "amount", "payment_method", "is_recurring", "recurring_interval", "notes"];
  const rows = expenses.map((expense) =>
    headers.map((header) => escapeCsv(header === "category" ? expense.category_name : expense[header])).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

module.exports = { expensesToCsv };
