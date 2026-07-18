import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("schools", (table) => {
    table.increments("id").primary();
    table.string("name", 160).notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("courses", (table) => {
    table.increments("id").primary();
    table.integer("school_id").references("id").inTable("schools").onDelete("CASCADE");
    table.string("title", 220).notNullable();
    table.string("status", 40).notNullable().defaultTo("active");
    table.string("priority", 40).notNullable().defaultTo("medium");
    table.string("owner", 160).notNullable();
    table.jsonb("metadata").notNullable().defaultTo("{}");
    table.timestamps(true, true);
    table.index(["status", "priority"]);
  });

  await knex.schema.createTable("activity_events", (table) => {
    table.increments("id").primary();
    table.integer("course_id").references("id").inTable("courses").onDelete("CASCADE");
    table.string("event_type", 80).notNullable();
    table.text("message").notNullable();
    table.jsonb("payload").notNullable().defaultTo("{}");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("activity_events");
  await knex.schema.dropTableIfExists("courses");
  await knex.schema.dropTableIfExists("schools");
}
