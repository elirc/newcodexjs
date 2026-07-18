/**
 * Creates categories, expenses, and budgets.
 * @param {import("knex").Knex} knex Knex instance.
 * @returns {Promise<void>}
 */
exports.up = async function up(knex) {
  await knex.schema.createTable("categories", (table) => {
    table.increments("id").primary();
    table.string("name", 50).notNullable().unique();
    table.string("icon", 50).notNullable();
    table.string("color", 7).notNullable();
    table.boolean("is_default").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
  await knex.schema.createTable("expenses", (table) => {
    table.increments("id").primary();
    table.decimal("amount", 10, 2).notNullable();
    table.string("description", 255).notNullable();
    table.integer("category_id").notNullable().references("id").inTable("categories");
    table.date("expense_date").notNullable();
    table.string("payment_method", 30).notNullable().defaultTo("cash");
    table.boolean("is_recurring").notNullable().defaultTo(false);
    table.string("recurring_interval", 20);
    table.text("notes");
    table.timestamps(true, true);
    table.check("amount > 0");
    table.check("payment_method in ('cash', 'credit_card', 'debit_card', 'bank_transfer', 'other')");
    table.check("recurring_interval is null or recurring_interval in ('weekly', 'monthly')");
  });
  await knex.schema.createTable("budgets", (table) => {
    table.increments("id").primary();
    table.integer("category_id").notNullable().references("id").inTable("categories");
    table.date("month").notNullable();
    table.decimal("amount", 10, 2).notNullable();
    table.timestamps(true, true);
    table.unique(["category_id", "month"]);
    table.check("amount > 0");
  });
};

/**
 * Drops tables in dependency order.
 * @param {import("knex").Knex} knex Knex instance.
 * @returns {Promise<void>}
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("budgets");
  await knex.schema.dropTableIfExists("expenses");
  await knex.schema.dropTableIfExists("categories");
};
