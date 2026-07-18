import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("products", (table) => {
    table.increments("id").primary();
    table.string("sku", 255).notNullable();
    table.string("name", 255).notNullable();
    table.string("category", 255).notNullable();
    table.string("status", 255).notNullable();
    table.jsonb("tags").notNullable().defaultTo("[]");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("products");
}
