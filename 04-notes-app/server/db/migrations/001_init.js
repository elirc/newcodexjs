exports.up = async function up(knex) {
  await knex.schema.createTable("notes", (table) => {
    table.increments("id").primary();
    table.string("title", 255).notNullable();
    table.text("body");
    table.string("folder", 255).notNullable();
    table.string("status", 255).notNullable();
    table.jsonb("tags").notNullable().defaultTo("[]");
    table.timestamps(true, true);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists("notes");
};
