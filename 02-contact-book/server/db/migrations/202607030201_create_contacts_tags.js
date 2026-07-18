/**
 * Creates contacts, tags, and the many-to-many contact_tags junction table.
 * @param {import("knex").Knex} knex Knex instance.
 * @returns {Promise<void>}
 */
exports.up = async function up(knex) {
  await knex.schema.createTable("contacts", (table) => {
    table.increments("id").primary();
    table.string("first_name", 100).notNullable();
    table.string("last_name", 100).notNullable();
    table.string("email", 255).unique();
    table.string("phone", 30);
    table.string("company", 255);
    table.string("street_address", 255);
    table.string("city", 100);
    table.string("state", 100);
    table.string("zip_code", 20);
    table.string("country", 100);
    table.text("notes");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("tags", (table) => {
    table.increments("id").primary();
    table.string("name", 50).notNullable().unique();
    table.string("color", 7).notNullable().defaultTo("#6366f1");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("contact_tags", (table) => {
    table.integer("contact_id").notNullable().references("id").inTable("contacts").onDelete("CASCADE");
    table.integer("tag_id").notNullable().references("id").inTable("tags").onDelete("CASCADE");
    table.primary(["contact_id", "tag_id"]);
  });
};

/**
 * Drops contact tables in dependency order.
 * @param {import("knex").Knex} knex Knex instance.
 * @returns {Promise<void>}
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("contact_tags");
  await knex.schema.dropTableIfExists("tags");
  await knex.schema.dropTableIfExists("contacts");
};
