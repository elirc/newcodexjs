/**
 * Seeds categories, budgets, and realistic expense records.
 * @param {import("knex").Knex} knex Knex instance.
 * @returns {Promise<void>}
 */
exports.seed = async function seed(knex) {
  await knex("budgets").del();
  await knex("expenses").del();
  await knex("categories").del();

  const categories = await knex("categories").insert([
    { name: "Groceries", icon: "shopping-cart", color: "#16a34a", is_default: true },
    { name: "Rent", icon: "home", color: "#2563eb", is_default: true },
    { name: "Transportation", icon: "car", color: "#f59e0b", is_default: true },
    { name: "Dining", icon: "utensils", color: "#ef4444", is_default: true },
    { name: "Utilities", icon: "zap", color: "#7c3aed", is_default: true },
    { name: "Fitness", icon: "heart", color: "#0891b2", is_default: false },
    { name: "Books", icon: "book", color: "#475569", is_default: false }
  ]).returning("*");

  const month = "2026-07-01";
  await knex("budgets").insert(categories.slice(0, 6).map((category, index) => ({
    category_id: category.id,
    month,
    amount: [650, 1800, 300, 450, 240, 120][index]
  })));

  const descriptions = ["Weekly shop", "Apartment rent", "Fuel refill", "Team lunch", "Electric bill", "Gym membership", "Technical book", "Coffee meeting"];
  const methods = ["cash", "credit_card", "debit_card", "bank_transfer", "other"];
  const expenses = Array.from({ length: 60 }, (_, index) => ({
    amount: Number((12 + ((index * 17) % 190) + (index % 3) * 0.49).toFixed(2)),
    description: descriptions[index % descriptions.length],
    category_id: categories[index % categories.length].id,
    expense_date: `2026-07-${String((index % 28) + 1).padStart(2, "0")}`,
    payment_method: methods[index % methods.length],
    is_recurring: index % 14 === 0,
    recurring_interval: index % 28 === 0 ? "monthly" : index % 14 === 0 ? "weekly" : null,
    notes: index % 9 === 0 ? "Seeded recurring or budget-sensitive example." : null
  }));
  await knex("expenses").insert(expenses);
};
