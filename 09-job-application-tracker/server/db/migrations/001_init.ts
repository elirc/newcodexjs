import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("applications", (table) => {
    table.increments("id").primary();
    table.string("company", 255).notNullable();
    table.string("role", 255).notNullable();
    table.string("stage", 255).notNullable();
    table.string("status", 255).notNullable();
    table.jsonb("tags").notNullable().defaultTo("[]");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("applications");
}
