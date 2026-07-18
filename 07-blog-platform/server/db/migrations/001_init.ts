import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("posts", (table) => {
    table.increments("id").primary();
    table.string("title", 255).notNullable();
    table.text("body");
    table.string("slug", 255).notNullable();
    table.string("status", 255).notNullable();
    table.jsonb("tags").notNullable().defaultTo("[]");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("posts");
}
