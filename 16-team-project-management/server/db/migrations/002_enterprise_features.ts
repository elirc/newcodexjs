import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("tasks", (table) => {
    table.timestamp("due_at").nullable();
    table.string("risk_level", 40).notNullable().defaultTo("normal");
    table.integer("version").notNullable().defaultTo(1);
    table.timestamp("archived_at").nullable();
    table.timestamp("deleted_at").nullable();
    table.index(["workspace_id", "status", "priority"]);
    table.index(["deleted_at", "archived_at"]);
  });

  await knex.schema.createTable("comments", (table) => {
    table.increments("id").primary();
    table
      .integer("task_id")
      .references("id")
      .inTable("tasks")
      .onDelete("CASCADE");
    table.string("author", 160).notNullable();
    table.text("body").notNullable();
    table.boolean("is_internal").notNullable().defaultTo(false);
    table.timestamps(true, true);
  });

  await knex.schema.createTable("saved_views", (table) => {
    table.increments("id").primary();
    table
      .integer("workspace_id")
      .references("id")
      .inTable("workspaces")
      .onDelete("CASCADE");
    table.string("name", 160).notNullable();
    table.jsonb("filters").notNullable().defaultTo("{}");
    table.string("created_by", 160).notNullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable("audit_log", (table) => {
    table.increments("id").primary();
    table
      .integer("task_id")
      .nullable()
      .references("id")
      .inTable("tasks")
      .onDelete("SET NULL");
    table.string("actor", 160).notNullable();
    table.string("action", 80).notNullable();
    table.jsonb("before").nullable();
    table.jsonb("after").nullable();
    table.string("request_id", 80).notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("audit_log");
  await knex.schema.dropTableIfExists("saved_views");
  await knex.schema.dropTableIfExists("comments");
  await knex.schema.alterTable("tasks", (table) => {
    table.dropIndex(["workspace_id", "status", "priority"]);
    table.dropIndex(["deleted_at", "archived_at"]);
    table.dropColumn("due_at");
    table.dropColumn("risk_level");
    table.dropColumn("version");
    table.dropColumn("archived_at");
    table.dropColumn("deleted_at");
  });
}
